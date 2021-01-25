import Lib from "./lib";
import { Promise as BPromise } from "bluebird";

export function ValPromisify(fn) {
    return function(...args) {
        return new BPromise((resolve, reject) => {
            fn.call(this, ...args, function(err, data) {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }
}

export interface ICallback<T> {
    (err: any, o: T | null): void;
}

export enum ELogLevel {
    trace = "trace",
    debug = "debug",
    info = "info",
    warn = "warn",
    err = "err",
    critical = "critical",
    off = "off"
}

export enum ESnapshotType {
    Frame,
    Face,
    Feature
}

export enum EFrameSnapshotType {
    frame = "frame"
}

export enum EFaceSnapshotType {
    image = "image",
    face = "face",
    frame = "frame"
}

export enum EFaceFeatureSnapshotType {
    image = "image",
    face = "face",
    frame = "frame",
    aligned = "aligned",
    feature = "feature"
}

export enum EImageEncodeFormatType {
    jpg = "jpg",
    png = "png"
}

export interface ISharedFaceSize {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ISharedEncodeBaseConfig {
    encodeType?: EImageEncodeFormatType;
}

interface ISharedAnchorBaseConfig {
    withAnchor?: boolean;
}

export type ISharedFileBaseConfig = ISharedEncodeBaseConfig & {
    path: string;
    postfix?: string;
    /// default: false
    withTimestamp?: boolean;
}

export type ISharedBufferBaseConfig = ISharedEncodeBaseConfig & {
    /// default false
    base64?: boolean;
    /// default false
    base64AsString?: boolean;
}

interface ISharedBufferStringCriteria {
    base64: true;
    base64AsString: true;
}

interface ISharedSnapshotTypeBase<T> {
    snapshotType?: T;
}

type ISharedSnapshotType<T> =
    T extends ESnapshotType.Frame ? ISharedSnapshotTypeBase<EFrameSnapshotType> :
    T extends ESnapshotType.Face ? ISharedSnapshotTypeBase<EFaceSnapshotType> :
    T extends ESnapshotType.Feature ? ISharedSnapshotTypeBase<EFaceFeatureSnapshotType> :
    never;


type ISharedFrameSnapshotConfig = ISharedSnapshotType<ESnapshotType.Frame>;
type ISharedFrameFileConfig = ISharedFrameSnapshotConfig & ISharedFileBaseConfig;
type ISharedFrameBufferConfig = ISharedFrameSnapshotConfig & ISharedBufferBaseConfig;
type ISharedFrameBufferCase = ISharedFrameBufferConfig;
type ISharedFrameStringCase = ISharedFrameBufferConfig & ISharedBufferStringCriteria;

export interface ISharedFrame {
    dispose();

    getSize(config?: ISharedFrameSnapshotConfig): ISharedFaceSize;

    saveFileWithCallback(callback: ICallback<string>): void;
    saveFileWithCallback(config: ISharedFrameFileConfig, callback: ICallback<string>): void;
    saveFile(config: ISharedFrameFileConfig): Promise<string>;
    
    getBufferWithCallback(callback: ICallback<Buffer>): void;
    getBufferWithCallback(config: ISharedFrameStringCase, callback: ICallback<string>): void;
    getBufferWithCallback(config: ISharedFrameBufferCase, callback: ICallback<Buffer>): void;
    getBuffer(config: ISharedFrameStringCase): Promise<string>;
    getBuffer(config?: ISharedFrameBufferCase): Promise<Buffer>;
}
Lib.ValSharedFrame.prototype.saveFile = ValPromisify(Lib.ValSharedFrame.prototype.saveFileWithCallback);
Lib.ValSharedFrame.prototype.getBuffer = ValPromisify(Lib.ValSharedFrame.prototype.getBufferWithCallback);


type ISharedCapturedFaceSnapshotConfig = ISharedSnapshotType<ESnapshotType.Face>;
type ISharedCapturedFaceFileConfig = ISharedCapturedFaceSnapshotConfig & ISharedAnchorBaseConfig & ISharedFileBaseConfig;
type ISharedCapturedFaceBufferConfig = ISharedCapturedFaceSnapshotConfig & ISharedAnchorBaseConfig & ISharedBufferBaseConfig;
type ISharedCapturedFaceBufferCase = ISharedCapturedFaceBufferConfig;
type ISharedCapturedFaceStringCase = ISharedCapturedFaceBufferConfig & ISharedBufferStringCriteria;

export interface ISharedCapturedFace {
    dispose();

    getSize(config?: ISharedCapturedFaceSnapshotConfig): ISharedFaceSize;

    saveFileWithCallback(callback: ICallback<string>): void;
    saveFileWithCallback(config: ISharedCapturedFaceFileConfig, callback: ICallback<string>): void;
    saveFile(config: ISharedCapturedFaceFileConfig): Promise<string>;

    getBufferWithCallback(callback: ICallback<Buffer>): void;
    getBufferWithCallback(config: ISharedCapturedFaceStringCase, callback: ICallback<string>): void;
    getBufferWithCallback(config: ISharedCapturedFaceBufferCase, callback: ICallback<Buffer>): void;
    getBuffer(config: ISharedCapturedFaceStringCase): Promise<string>;
    getBuffer(config?: ISharedCapturedFaceBufferCase): Promise<Buffer>;

    readonly score: number;
    readonly pitch: number;
    readonly yaw: number;
}
Lib.ValSharedCapturedFace.prototype.saveFile = ValPromisify(Lib.ValSharedCapturedFace.prototype.saveFileWithCallback);
Lib.ValSharedCapturedFace.prototype.getBuffer = ValPromisify(Lib.ValSharedCapturedFace.prototype.getBufferWithCallback);


type ISharedFeatureSnapshotConfig = ISharedSnapshotType<ESnapshotType.Feature>;
type ISharedFeatureFileConfig = ISharedFeatureSnapshotConfig & ISharedAnchorBaseConfig & ISharedFileBaseConfig;
type ISharedFeatureBufferConfig = ISharedFeatureSnapshotConfig & ISharedAnchorBaseConfig & ISharedBufferBaseConfig;
type ISharedFeatureBufferCase = ISharedFeatureBufferConfig;
type ISharedFeatureStringCase = ISharedFeatureBufferConfig & ISharedBufferStringCriteria;

export interface ISharedFeature {
    dispose();

    getSize(config?: ISharedFeatureSnapshotConfig): ISharedFaceSize;

    saveFileWithCallback(callback: ICallback<string>): void;
    saveFileWithCallback(config: ISharedFeatureFileConfig, callback: ICallback<string>): void;
    saveFile(config: ISharedFeatureFileConfig): Promise<string>;

    getBufferWithCallback(callback: ICallback<Buffer>): void;
    getBufferWithCallback(config: ISharedFeatureStringCase, callback: ICallback<string>): void;
    getBufferWithCallback(config: ISharedFeatureBufferCase, callback: ICallback<Buffer>): void;
    getBuffer(config: ISharedFeatureStringCase): Promise<string>;
    getBuffer(config?: ISharedFeatureBufferCase): Promise<Buffer>;

    readonly score: number;
    readonly pitch: number;
    readonly yaw: number;
}
Lib.ValSharedExtractedFeature.prototype.saveFile = ValPromisify(Lib.ValSharedExtractedFeature.prototype.saveFileWithCallback);
Lib.ValSharedExtractedFeature.prototype.getBuffer = ValPromisify(Lib.ValSharedExtractedFeature.prototype.getBufferWithCallback);

export interface IInputPagingBase {
    page?: number;
    pageSize?: number;
    all?: "true" | "false";
}

export interface IOutputPagingBase {
    total: number;
    totalPages?: number;
}

/// Helper Functions
// export function ValDisposeAll(obj: any) {
//     if (obj == null) return;
//     if (Array.isArray(obj)) {
//         obj.forEach(v => ValDisposeAll(v));
//     } else {
//         if (obj.Dispose) {
//             obj.Dispose();
//         }
//     }
// }

export function ValDisposeAll(...obj: any[]) {
    if (obj.length === 0) return;
    obj.forEach(v => {
        if (Array.isArray(v)) return ValDisposeAll(...v);
        v && v.dispose && v.dispose();
    });
}
