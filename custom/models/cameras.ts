import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

import { ValRtspConnector, ValFaceCapture, ValFaceFeature, ValDisposeAll, ISharedCapturedFace, EImageEncodeFormatType, EFaceSnapshotType, ISharedFeature, EFaceFeatureSnapshotType, ELogLevel, EFrameSnapshotType } from 'workspace/custom/modules/valxnet';

export enum EType {
    rtsp,
    cms3
}

export interface ICameraRTSPConfig {
    /// default: true. only decode iframe. false to decode all.
    ionly?: boolean;
    /// default: 1 (second). not support right now.
    captureInterval?: number;
    /// default: 0.99
    fcConfidenceScore?: number;
    /// default: 30. at most N faces capture per frame
    fcMaxCaptureFaces?: number;
    /// default: 0. face w & h should be larger than N (px).
    fcMinFaceLength?: number;
    /// default: 60. face pitch should be less than N (degree).
    fcMaxPitchAngle?: number;
    /// default: 30. face yaw should be less than N (degree).
    fcMaxYawAngle?: number;
}

export interface ICameraRTSP {
    type: EType.rtsp;
    rtspUrl: string;
    config?: ICameraRTSPConfig;
}

export type UNDER_CONSTRUCTION = never;

export type ICameraCMS3 = {
    type: EType.cms3;
    value: UNDER_CONSTRUCTION;
}

export interface ICamerasBase {
    name: string;
    /// default: true
    enable?: boolean;
}

export type ICameras = ICamerasBase &
    ICameraRTSP;
    // (ICameraRTSP | ICameraCMS3);

export let CameraList: { [objectId: string]: ValCameraReceiver } = {};

@registerSubclass() export class Cameras extends ParseObject<ICameras> {
    static async init() {
        let cameras = await new Parse.Query(Cameras).find();
        
        for (let camera of cameras) {
            let objectId = camera.id;
            /// ignore existing FRS
            if (CameraList[objectId]) continue;
            this.update(camera);
        }
    }

    static async update(camera: Cameras) {
        let cam: any = camera;
        let objectId = cam.objectId || cam.id;
        let config = camera instanceof Cameras ? camera.attributes : camera;
        let enable = config.enable === undefined ? true : config.enable;
        /// update when:
        /// 1) sync added
        /// 2) sync deleted
        /// 3) modified account / password
        this.delete(objectId);
        if (enable) {
            let instance = CameraList[objectId] = new ValCameraReceiver(camera);
            instance.start();
        }
    }

    static async delete(cameraid: string);
    static async delete(camera: Cameras);
    static async delete(camera: string | Cameras) {
        if (camera instanceof Cameras) camera = camera.id;
        CameraList[camera] && CameraList[camera].dispose();
        delete CameraList[camera];
    }
}
// ////////////////////////////////////////////////////

import { URL } from "url";
import { Log, idGenerate } from 'helpers/utility';
import { Subject, Subscription } from 'rxjs';
import { ICameraLive } from './camera-live';
import * as path from 'path';
import * as fs from 'fs';

export const sjCameraLive: Subject<ICameraLive> = new Subject<ICameraLive>();
// const snapshotPath = path.resolve(__dirname, "../assets/snapshots");
const snapshotPath = path.resolve(process.cwd(), "./workspace/custom/assets/snapshots");
if (!fs.existsSync(snapshotPath)) fs.mkdirSync(snapshotPath);

let snapshotTsPath: string;
let prevTimeValue: number;
function makeSnapshotPathWithTimestamp(): string {
    let now = new Date();
    let timezoneOffset = now.getTimezoneOffset() * 60;
    let nowValue = Math.floor(now.valueOf() / 1000 + timezoneOffset);
    let timeValue = nowValue - nowValue % 86400;
    let finalPath = path.resolve(snapshotPath, timeValue.toString());
    if (prevTimeValue === timeValue) {
        return finalPath;
    }
    prevTimeValue = timeValue;
    if (!fs.existsSync(finalPath)) fs.mkdirSync(finalPath);
    return finalPath;
}

const LogTitle = "ValCameraReceiver";
export class ValCameraReceiver {
    device: ValRtspConnector;
    subscription: Subscription;
    constructor(camera: Cameras) {
        let cameraId = camera.id;
        let attrs = camera.attributes;
        let config = attrs.config || {};
        let ionly = config.ionly === undefined ? true : config.ionly;

        let fc = new ValFaceCapture();
        // fc.logLevel = ELogLevel.trace;
        let ff = new ValFaceFeature();

        let url = new URL(attrs.rtspUrl);
        this.device = new ValRtspConnector({ ip: url.hostname, port: parseInt(url.port, 10), account: url.username, password: url.password, uri: `${url.pathname}${url.search || ""}`, ionly });
        // this.device.logLevel = ELogLevel.trace;
        this.subscription = this.device.subscribe(async (streamObject) => {
            let finalPath: string = makeSnapshotPathWithTimestamp();
            try {
                let detects: ISharedCapturedFace[];
                let datetime: Date = new Date();
                try {
                    detects = await fc.detect(streamObject, {
                        confidenceScore: config.fcConfidenceScore,
                        maxCaptureFaces: config.fcMaxCaptureFaces,
                        maxPitchAngle: config.fcMaxPitchAngle,
                        maxYawAngle: config.fcMaxYawAngle,
                        minFaceLength: config.fcMinFaceLength
                    });
                    // console.log("detected:", detects.length);
                    // /// save the image to see something
                    // await streamObject.saveFile({
                    //     snapshotType: EFrameSnapshotType.frame,
                    //     path: path.resolve(__dirname, "../tmp"),
                    //     withTimestamp: true
                    // });
                    if (detects.length === 0) return;

                    let features: ISharedFeature[];
                    try {
                        features = await ff.extract(detects);
                        for (let i=0; i<features.length; ++i) {
                            let featureObject = features[i];
                            let idgen = idGenerate();
                            let imageUri = await featureObject.saveFile({ path: finalPath, postfix: idgen, encodeType: EImageEncodeFormatType.jpg, snapshotType: EFaceFeatureSnapshotType.image });
                            imageUri = path.join(path.basename(finalPath), path.basename(imageUri));

                            let feature = await featureObject.getBuffer({ snapshotType: EFaceFeatureSnapshotType.feature, base64: true, base64AsString: true });
                            let imageRect = featureObject.getSize({ snapshotType: EFaceFeatureSnapshotType.image });
                            let faceRect = featureObject.getSize({ snapshotType: EFaceFeatureSnapshotType.face });
                            let confidenceScore = toFixedNumber(featureObject.score, 3);
                            let pitch = toFixedNumber(featureObject.pitch, 3);
                            let yaw = toFixedNumber(featureObject.yaw, 3);
                            
                            // make ICameraLive
                            let o: ICameraLive = {
                                cameraId,
                                imageUri,
                                feature,
                                datetime,
                                imageRect,
                                faceRect,
                                confidenceScore,
                                pitch,
                                yaw
                            }
                            sjCameraLive.next(o);
                        }
                    }
                    catch (e) { Log.Error(LogTitle, `FR catch error: ${e}`) }
                    finally { ValDisposeAll(features) }

                }
                catch (e) { Log.Error(LogTitle, `FC catch error: ${e}`) }
                finally { ValDisposeAll(detects) }

            }
            catch (e) { Log.Error(LogTitle, `streamObject catch error: ${e}`) }
            finally { ValDisposeAll(streamObject) };
        });
    }

    start() {
        this.device.Start();
    }
    stop() {
        this.device.Stop();
    }
    dispose() {
        this.stop();
        this.subscription.unsubscribe();
    }
}


function toFixedNumber(num, digits, base = 10){
    var pow = Math.pow(base, digits);
    return Math.round(num*pow) / pow;
}