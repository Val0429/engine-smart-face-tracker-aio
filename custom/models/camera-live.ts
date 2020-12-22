import { IExtractedInfo } from "./extracted-info";

export type ICameraLive = {
    /// objectId of Camera
    cameraId: string;
    /// created datetime
    datetime: Date;

} & IExtractedInfo;