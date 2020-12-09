import { IConfigSetup } from "core/config.gen";

export const LogTitle = "FRSManager Server";
export const ServerKey = "frsmanager";
export type IServerCoreConfig = IConfigSetup["frsmanager"];

export interface IServerConfig {
    server: IServerCoreConfig;
    debug?: boolean;
}

export enum RequestLoginReason {
    SessionExpired
}

/// legacy
export enum UserType {
    UnRecognized = 0,
    Recognized = 1,
}

enum EReportPersonType {
    staff = 1,
    visitor,
    stranger,
}
enum EReportEntryStatus {
    access_granted = 1,
    access_denied,
    off_schedule,
}
namespace ILocation {
    export interface ICoordinate {
        lat: number;
        lng: number;
    }    
}
export interface IOutputPerson {
    objectId: string;
    relatedId?: string;
    /// to enhance find speed
    isStranger?: boolean;
    /// type: string;
    type: 'staff' | 'visitor' | 'stranger';
    status: string;
    date: Date;
    time: Date;
    lastAppearingDate: Date;
    lastAppearingTime: Date;
    score: number;
    imageSrc: string;
    imageLocal?: boolean;
    sourceId: string;
    sourceName: string;
    isIn: boolean;
    locationBuildingId: string;
    locationBuildingName: string;
    locationLocation: ILocation.ICoordinate;
    locationAddress: string;
    locationFloorId: string;
    locationFloorName: string;
    locationCompanyId: string;
    locationCompanyName: string;
    locationAccessAreaId: string;
    locationAccessAreaName: string;
    locationIsHighSafety: boolean;
    locationSourceFRSId: string;
    locationSourceFRSName: string;
    locationSourceFRSCameraId: string;
    locationSourceFRSCameraName: string;
    personId: string;
    personCompanyId: string;
    personCompanyName: string;
    personImageSrc: string;
    personEmployeeId: string;
    personName: string;
    personTagId: string;
    personTagName: string;
    personPosition: string;
    personPhone: string;
    personIdNumber: string;
    personEmail: string;
    personRemark: string;
    personCard: string;
    createdDate: Date;

    faceFeature: Buffer;
    valFaceId?: number;
    continuousId?: number;
}
export const IOutputPersonDBCollection = "Persons";

export interface IOutputException {
    type: 'vip' | 'blacklist' | 'high_security_area' | 'trespassing';
    person: IOutputPerson | string;
    continuousId?: number;

    date: Date;
    time: Date;
    createdDate: Date;
}
export const IOutputExceptionDBCollection = "Exceptions";

export function IOutputPersonPrehandle(person: IOutputPerson): IOutputPerson {
    /// set isStranger
    person.isStranger = person.type === "stranger";
    /// convert date / time
    person.date = new Date(person.date);
    person.time = new Date(person.time);
    person.createdDate = new Date(person.createdDate);
    /// pre-set date / time
    person.lastAppearingDate = person.date;
    person.lastAppearingTime = person.time;
    /// convert faceFeature
    person.faceFeature = new Buffer((person as any).faceFeature, 'binary');
    /// convert url
    person.imageSrc = (this as any).makeUrl(person.imageSrc);
    person.personImageSrc = (this as any).makeUrl(person.personImageSrc);

    return person;
}

export function IOutputPersonPostIntoDBHandle(person: IOutputPerson): IOutputPerson {
    /// only stranger need to save faceFeature
    /// already related also no need faceFeature
    if (!person.isStranger || person.relatedId) delete person.faceFeature;
    return person;
}