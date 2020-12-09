import { IOutputPerson, IOutputPersonDBCollection,
    IOutputException, IOutputExceptionDBCollection,
    IOutputPersonPostIntoDBHandle } from "../frs-manager-service/libs/core";
import { Subject } from "rxjs";
import { filterFace } from './libs/filter-face';
import { bufferTime } from "rxjs/operators";
import { FaceFeatureCompare } from './libs/face-feature-compare';
import { Config } from "core/config.gen";
import { Log } from "helpers/utility";
import { sharedMongoDB } from "helpers/cgi-helpers/core";
import { saveSnapshot } from "./libs/save-snapshot";


const LogTitle = "VTSFaceMergeService";

/// timetrack & app preload max, + associate max
const keepSeconds = 1440*60 + 180;
const getStartDate = () => {
    let now = new Date();
    return new Date(now.valueOf() - keepSeconds * 1000);
}
const getMatchScore = () => Config.vts.matchScore;
const getNotAllowedTimes = () => Config.vts.notAllowedAreaDetectionTimes;
const getNotAllowedSeconds = () => Config.vts.notAllowedAreaDurationSeconds;

interface ExceptionIndexing {
    [valFaceId: string]: IOutputException[];
}

interface TrepassingIndexing {
    [locationSourceFRSCameraId: string]: {
        [personUniqueId: string]: {
            person: IOutputPerson;
            count: number;
            createdDate: Date;
        }
    }
}

export class VTSFaceMerge {
    private sjPersons: Subject<IOutputPerson> = new Subject<IOutputPerson>();
    public sjLivePersons: Subject<IOutputPerson> = new Subject<IOutputPerson>();
    public sjLiveExceptions: Subject<IOutputException> = new Subject<IOutputException>();
    public sjLiveHandledDBFace: Subject<IOutputPerson> = new Subject<IOutputPerson>();

    /// maintain a list of strangers
    private keepStrangers: IOutputPerson[] = [];

    private tryMatchPerson(person: IOutputPerson): IOutputPerson {
        let matchScore = getMatchScore();
        do {
            if (!person.isStranger) break;
            /// compare all strangers for match
            let i=this.keepStrangers.length-1;
            for (; i>=0; --i) {
                let previous = this.keepStrangers[i];
                let score = FaceFeatureCompare.sync(person.faceFeature, previous.faceFeature);
                console.log("compare score", score, matchScore, previous.objectId);
                if (score >= matchScore) {
                    /// match
                    person.relatedId = previous.relatedId || previous.objectId;
                    console.log("match!!!", person.personName, person.relatedId);
                    break;
                }
            }
            let total = this.keepStrangers.length - i - 1;
            total !== 0 && Log.Info(LogTitle, `Matches stranger with count ${total}`);
        } while(0);
        return person;
    }

    constructor() {
        (async () => {
            const db = await sharedMongoDB();
            const collection = IOutputPersonDBCollection;
            const collectionEx = IOutputExceptionDBCollection;
            let col = db.collection(collection);
            let colEx = db.collection(collectionEx);

            /// load keep strangers!
            let startDate = getStartDate();
            let pt = Log.InfoTime(LogTitle, "Preload caching person...");
            let result = await col.find({
                isStranger: { $eq: true },
                relatedId: { $exists: false },
                date: { $gte: startDate }
            }).toArray();
            result.forEach(o => o.faceFeature = o.faceFeature.buffer);
            this.keepStrangers = result;
            pt.end();

            /// subscribe on new persons
            this.sjPersons.pipe( filterFace(this, (compared) => {
                this.handleNewPerson(compared);
            }) ).subscribe(this.sjLiveHandledDBFace);
    
            /// handle write to DB!
            this.sjLiveHandledDBFace
                .do((person) => {
                    /// post handle before save into db
                    IOutputPersonPostIntoDBHandle(person);
                    /// add to tail
                    person.faceFeature && this.keepStrangers.push(person);
                })
                .pipe( saveSnapshot(30) )
                .pipe( bufferTime(1000) )
                .subscribe(async (persons: IOutputPerson[]) => {
                    if (persons.length === 0) return;
                    col.insertMany(persons);

                    /// insert exceptions right here
                    let exceptions = persons.reduce((final, value) => {
                        let exs = this.GetCachedException(value);
                        exs.forEach(ex => final.push(ex));
                        return final;
                    }, [] as IOutputException[]);
                    if (exceptions.length !== 0) colEx.insertMany(exceptions);

                    /// do recycle
                    let startDate = getStartDate();
                    while (this.keepStrangers.length > 0) {
                        let current = this.keepStrangers[0];
                        if (current.date < startDate) {
                            /// remove from front
                            this.keepStrangers.shift();
                        } else {
                            /// procedure end
                            break;
                        }
                    }
                });

            /// timeout trepassing
            setInterval(() => this.timeoutTrepassing(), 1000);
        })();
    }

    public next(person: IOutputPerson) {
        this.sjPersons.next(person);
    }

    /// new person handler ///////////////////////
    private index_exceptions: ExceptionIndexing = {};
    private GetCachedException(person: IOutputPerson): IOutputException[] {
        let vid = person.valFaceId;
        let result = this.index_exceptions[vid];
        if (result) {
            delete this.index_exceptions[vid];
            result.forEach(o => {
                /// map to objectId to save
                // o.person = (o.person as IOutputPerson).objectId;
                o.person = person.objectId;
            });
        }
        return result || [];
    }

    private handleNewPerson(person: IOutputPerson) {
        /// output live person
        this.sjLivePersons.next(person);        

        let exceptions: IOutputException[] = [];
        let generalObject = {
            person,
            continuousId: person.continuousId,
            date: person.date,
            time: person.time,
            createdDate: person.createdDate
        }

        if (person.valFaceId === person.continuousId) {
            /// 1) detect exception
            /// todo: remove Watchlist
            console.log("person tag name!!!", person.personTagName, person.personTagName === "Watchlist", person.continuousId);
            if (person.personTagName === "VIP" || person.personTagName === "Watchlist") {
                /// 1.1) VIP. only happen on valFaceId === continuousId
                exceptions.push({
                    type: "vip",
                    ...generalObject
                });
            }

            if (person.personTagName === "Blacklist") {
                /// 1.2) Blacklist. only happen on valFaceId === continuousId
                exceptions.push({
                    type: "blacklist",
                    ...generalObject
                });
            }
            
            if (person.locationIsHighSafety) {
                /// 1.3) High Security Area. only happen on valFaceId === continuousId
                exceptions.push({
                    type: "high_security_area",
                    ...generalObject
                });
            }
        }
        
        if (person.status === "access_denied") {
            /// 1.4) Trepassing
            let exception = this.handleTrepassing(person, generalObject);
            if (exception) exceptions.push(exception);
        }
        
        /// 2) cache with valFaceId
        var vid = person.valFaceId;
        var idx = this.index_exceptions[vid] || (this.index_exceptions[vid] = []);

        /// 3) next sjLiveExceptions
        exceptions.forEach(exception => {
            /// 2.1)
            idx.push(exception);
            this.sjLiveExceptions.next(exception);
        });

        console.log("what is the exception?", idx.map(id => id.type));
    }

    private index_trepassing: TrepassingIndexing = {};
    private handleTrepassing(person: IOutputPerson, generalObject: any): IOutputException {
        let idx = this.index_trepassing;
        let times = getNotAllowedTimes();

        let createdDate = new Date();
        let locationSourceFRSCameraId: string = person.locationSourceFRSCameraId;
        let personUniqueId: string = person.isStranger ? (person.relatedId || person.objectId) : person.personId;
        
        let frsCameraGroup = idx[locationSourceFRSCameraId] || (idx[locationSourceFRSCameraId] = {});
        let personGroup = frsCameraGroup[personUniqueId] || (frsCameraGroup[personUniqueId] = { person, count: 0, createdDate });
        personGroup.count++;
        if (personGroup.count >= times) {
            let rtn = {
                type: "trespassing",
                ...generalObject
            }
            delete frsCameraGroup[personUniqueId];
            return rtn;
        }
        return null;
    }

    // interface TrepassingIndexing {
    //     [locationSourceFRSCameraId: string]: {
    //         [personUniqueId: string]: {
    //             person: IOutputPerson;
    //             createdDate: Date;
    //         }
    //     }
    // }
    private timeoutTrepassing() {
        let seconds = getNotAllowedSeconds();
        let idx = this.index_trepassing;
        let now = new Date();
        
        Object.keys(idx).forEach(locationSourceFRSCameraId => {
            let frsCameraGroup = idx[locationSourceFRSCameraId];
            Object.keys(frsCameraGroup).forEach(personUniqueId => {
                let personGroup = frsCameraGroup[personUniqueId];
                let elapsed = (now.valueOf() - personGroup.createdDate.valueOf()) / 1000;
                if (elapsed >= seconds) {
                    /// do remove
                    delete frsCameraGroup[personUniqueId];
                }
            });
        });
    }
    //////////////////////////////////////////////
}

export default new VTSFaceMerge();