import Lib from "./lib";
import { ELogLevel, ISharedCapturedFace, ISharedFrame, ICallback, ValPromisify } from "./core";

interface IValFaceCaptureConfig {
    confidenceScore?: number;
    maxCaptureFaces?: number;
    minFaceLength?: number;
    maxPitchAngle?: number;
    maxYawAngle?: number;
}

export interface ValFaceCapture {
    new (): ValFaceCapture;

    logLevel: ELogLevel;
    detectWithCallback(value: ISharedFrame | Buffer, callback: ICallback<ISharedCapturedFace[]>): void;
    detectWithCallback(value: ISharedFrame | Buffer, config: IValFaceCaptureConfig, callback: ICallback<ISharedCapturedFace[]>): void;
    detect(value: ISharedFrame | Buffer): Promise<ISharedCapturedFace[]>;
    detect(value: ISharedFrame | Buffer, config: IValFaceCaptureConfig): Promise<ISharedCapturedFace[]>;
}
Lib.ValFaceCapture.prototype.detect = ValPromisify(Lib.ValFaceCapture.prototype.detectWithCallback);

export var ValFaceCapture: ValFaceCapture = Lib.ValFaceCapture;
