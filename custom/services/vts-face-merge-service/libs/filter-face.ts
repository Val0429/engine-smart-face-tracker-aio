import { Observable, Subject } from 'rxjs';
import { Config } from 'core/config.gen';
import { IOutputPerson } from './core';
import { FaceFeatureCompare } from './face-feature-compare';
import { UserType } from '../../frs-manager-service/libs/core';

interface Indexing {
    [channel: string]: {
        [type: number]: IOutputPerson[];
    }
}

interface Removing {
    [channel: string]: {
        [type: number]: number;
    }
}

let uniqueCount = 0;
const targetScore = () => Config.vts.blurFaceMergeScore;
const traceMilliSeconds = () => Config.vts.mergeFaceSeconds * 1000;
const specialScoreForUnRecognizedFace = () => Config.vts.blurFaceMergeScore;
const isStrangerDetection = () => Config.vts.enableStrangerDetection;
const assignCurrentPersonToPrevious = (current: IOutputPerson, prev: IOutputPerson) => {
    current.lastAppearingDate = current.date;
    current.lastAppearingTime = current.time;
    current.date = prev.date;
    current.time = prev.time;
    current.relatedId = prev.relatedId || prev.objectId;
    current.valFaceId = prev.valFaceId;
    Object.assign(prev, current);
}

/// filterFace:
/// callback with realtime merge valId
/// next with DB ready saving persons
export function filterFace(me: any, compareCallback: (face: IOutputPerson) => void = null) {

    let tryCallback = (face: IOutputPerson) => {
        compareCallback !== null && compareCallback(face);
    }

    return function(source): Observable<IOutputPerson> {
        /// list of ready-merging-faces cache
        let caches: IOutputPerson[] = [];
        /// index of caches, ready merging faces
        let indexes: Indexing = {};

        /// 0: unrecognized, 1: recognized
        let getPersonChannelAndType = (person: IOutputPerson): { channel: string, type: UserType } => {
            return {
                channel: person.locationSourceFRSCameraId,
                type: person.isStranger ? UserType.UnRecognized : UserType.Recognized
            }
        }
        let getPersonTimestamp = (person: IOutputPerson): number => {
            return person.date.valueOf();
        }

        /// make removing list by index
        let makeRemovingIndexes = (all: IOutputPerson[]): Removing => {
            let removing: Removing = {};
            for (let i=0; i<all.length; ++i) {
                let value = all[i];
                let { channel, type } = getPersonChannelAndType(value);
                /// create default
                let indexChannel = removing[channel];
                if (indexChannel === undefined) indexChannel = removing[channel] = {};
                let indexType = indexChannel[type];
                if (indexType == undefined) indexType = 0;
                /// increase
                indexChannel[type] = indexType+1;
            }
            return removing;
        }

        /// main function start
        return Observable.create( (subscriber) => {
            /// if no response more than tracing seconds, resolve.
            source.switchMap( () => {
                return Observable.timer(traceMilliSeconds())
            }).subscribe( () => resolveAll() );

            let resolveAll = () => {
                if (caches.length === 0) return;
                /// 1) remove indexes
                for (let channel in indexes) {
                    let channelObject = indexes[channel];
                    for (let type in channelObject) {
                        /// make clean
                        channelObject[type] = [];
                    }
                }
                /// 2) resolve all
                while (caches.length > 0) subscriber.next(caches.shift());
            }

            let resolveCache = (targetTime: number) => {
                /// 0) nothing to resolve
                if (caches.length === 0) return;
                let lasttime = targetTime || getPersonTimestamp(caches[caches.length-1]);
                /// 1) detect all resolving data at once
                let taken: number = undefined;
                for (let i=0; i<caches.length; ++i) {
                    let data = caches[i];
                    if (lasttime - getPersonTimestamp(data) < traceMilliSeconds()) break;
                    taken = i;
                }
                if (taken === undefined) return;
                /// 2) take all
                let all = caches.splice(0, taken+1);
                /// 3) remove indexes
                let removing = makeRemovingIndexes(all);
                for (let channel in removing) {
                    let channelObject = removing[channel];
                    for (let type in channelObject) {
                        let num = channelObject[type];
                        indexes[channel][type].splice(0, num);
                    }
                }
                /// 4) resolve all
                for (let data of all) subscriber.next(data);
            }

            let subscription = source.subscribe( (value: IOutputPerson) => {
                /// 0) get keys, create default index
                let { channel, type } = getPersonChannelAndType(value);
                /// if disable stranger detection
                if (type === UserType.UnRecognized && !isStrangerDetection())
                    return;

                let indexChannel = indexes[channel];
                if (indexChannel === undefined) indexChannel = indexes[channel] = {};
                let indexType = indexChannel[type];
                if (indexType == undefined) indexType = indexChannel[type] = [];

                /// 1) replace or new
                switch (type) {
                    case UserType.UnRecognized: {
                        let valrec = value;
                        valrec.continuousId = valrec.valFaceId = ++uniqueCount;
                        resolveCache(getPersonTimestamp(valrec));

                        let buffer = valrec.faceFeature as any as Buffer;
                        /// elimate more unrecognized as recognized
                        let indexTypeR = indexChannel[UserType.Recognized] || [];
                        for (let i=indexTypeR.length-1; i>=0; --i) {
                            let prev/*: RecognizedUser*/ = indexTypeR[i]/* as RecognizedUser*/;
                            if (
                                prev.personId === valrec.personId && valrec.score >= specialScoreForUnRecognizedFace()
                            ) {
                                /// totally remove this face
                                console.log(`valFaceId ${valrec.continuousId}:${valrec.valFaceId} removed.`);
                                return;
                            }
                        }

                        /// compare the rest unrecognized as same face
                        for (let i=indexType.length-1; i>=0; --i) {
                            let prev/*: UnRecognizedUser*/ = indexType[i] /*as UnRecognizedUser*/;
                            let prebuffer = prev.faceFeature as any as Buffer;
                            let score = FaceFeatureCompare.sync(buffer, prebuffer);
                            if (score < targetScore()) continue;
                            /// replace inplace
                            assignCurrentPersonToPrevious(valrec, prev);
                            /// also save
                            tryCallback(valrec);
                            console.log(`valFaceId ${valrec.continuousId}:${valrec.valFaceId} replaced.`);
                            return;
                        }

                        /// if new, preform all stranger match
                        me.tryMatchPerson(valrec);
                        tryCallback(valrec);
                        (indexType /*as UnRecognizedUser[]*/).push(valrec);
                        caches.push(valrec);
                        console.log(`valFaceId ${valrec.continuousId}:${valrec.valFaceId} is new.`);
                        break;
                    }

                    case UserType.Recognized: {
                        let valrec/*: RecognizedUser*/ = value /*as RecognizedUser*/;
                        valrec.continuousId = valrec.valFaceId = ++uniqueCount;
                        console.log(`valFaceId ${valrec.continuousId}:${valrec.valFaceId} is recognized.`);
                        resolveCache(getPersonTimestamp(valrec));
                        var personId = valrec.personId;

                        /// merge same recognized user together
                        for (let i=indexType.length-1; i>=0; --i) {
                            let prev/*: RecognizedUser*/ = indexType[i] /*as RecognizedUser*/;
                            if (prev.personId !== personId) continue;
                            /// replace inplace
                            assignCurrentPersonToPrevious(valrec, prev);
                            tryCallback(valrec);
                            return;
                        }

                        /// find previous unrecognized user simular
                        let indexTypeU = indexChannel[UserType.UnRecognized] || [];
                        for (let i=0; i<indexTypeU.length; ++i) {
                            let prev/*: UnRecognizedUser*/ = indexTypeU[i] /*as UnRecognizedUser*/;
                            if (
                                valrec.personId === prev.personId && prev.score >= specialScoreForUnRecognizedFace()
                            ) {
                                /// replace inplace
                                assignCurrentPersonToPrevious(valrec, prev);
                                tryCallback(valrec);
                                
                                /// put into recognized
                                indexTypeU.splice(i, 1);
                                let indexTypeR/*: RecognizedUser[]*/ = indexType /*as RecognizedUser[]*/;
                                let k = indexTypeR.length-1;
                                for (; k>=0; --k) {
                                    let temprec = indexTypeR[k];
                                    if (temprec.date < prev.date) break;
                                }
                                indexTypeR.splice(k+1, 0, prev);

                                /// remove every matches right after
                                for (let j=indexTypeU.length-1; j>=i; --j) {
                                    prev = indexTypeU[j] /*as UnRecognizedUser*/;
                                    if (
                                        valrec.personId === prev.personId && prev.score >= specialScoreForUnRecognizedFace()
                                    ) {
                                        indexTypeU.splice(j, 1);
                                    }
                                }
                                return;
                            }
                        }

                        tryCallback(valrec);
                        (indexType /*as RecognizedUser[]*/).push(valrec);
                        caches.push(valrec);
                        break;
                    }
                    default: throw "should not happen";
                }

            }, err => subscriber.error(err), () => {
                resolveAll();
                subscriber.complete();
            });
            
            return subscription;

        }).share();
    }
}