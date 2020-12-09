import Lib from "./lib";
import { ELogLevel, ISharedCapturedFace, ISharedFeature, ICallback, ValPromisify } from "./core";

export type IValFaceFeatureCompareTarget = ISharedFeature | Buffer;

/// Face Feature
export interface ValFaceFeature {
    new (): ValFaceFeature;

    logLevel: ELogLevel;

    extractWithCallback(value: ISharedCapturedFace, callback: ICallback<ISharedFeature>): void;
    extractWithCallback(value: ISharedCapturedFace[], callback: ICallback<ISharedFeature[]>): void;
    extract(value: ISharedCapturedFace): Promise<ISharedFeature>;
    extract(value: ISharedCapturedFace[]): Promise<ISharedFeature[]>;

    compare(lhs: IValFaceFeatureCompareTarget, rhs: IValFaceFeatureCompareTarget): number;
    compare(lhs: IValFaceFeatureCompareTarget, rhs: IValFaceFeatureCompareTarget[]): number[];

    /// should not use this when rhs.length < 10000
    compareAsyncWithCallback(lhs: IValFaceFeatureCompareTarget, rhs: IValFaceFeatureCompareTarget, callback: ICallback<number>): void;
    compareAsyncWithCallback(lhs: IValFaceFeatureCompareTarget, rhs: IValFaceFeatureCompareTarget[], callback: ICallback<number[]>): void;
    compareAsync(lhs: IValFaceFeatureCompareTarget, rhs: IValFaceFeatureCompareTarget): Promise<number>;
    compareAsync(lhs: IValFaceFeatureCompareTarget, rhs: IValFaceFeatureCompareTarget[]): Promise<number[]>;
}
Lib.ValFaceFeature.prototype.extract = ValPromisify(Lib.ValFaceFeature.prototype.extractWithCallback);
Lib.ValFaceFeature.prototype.compareAsync = ValPromisify(Lib.ValFaceFeature.prototype.compareAsyncWithCallback);

export var ValFaceFeature: ValFaceFeature = Lib.ValFaceFeature;
