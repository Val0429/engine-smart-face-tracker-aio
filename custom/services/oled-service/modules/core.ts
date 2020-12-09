import { Restful } from 'helpers/cgi-helpers/core';
import { IOLEDCMSs } from 'workspace/custom/models/cmss';
import { IOLEDFRSMs } from 'core/events.gen';

/// Building
export interface IBuilding {
    objectId: string;
    name: string;
    type: string;
    address: string;
}

/// Floor
export interface IFloor {
    objectId: string;
    building: IBuilding;
    name: string;
    level: number;
}

export interface INotifyFloor {
    objectId: string;
    buildingId: string;
    name: string;
    level: number;
}

/// Company
interface ICompanyLocation {
    floor: IFloor;
    building: IBuilding;
}

export interface ICompany {
    objectId: string;
    name: string;
    locations: ICompanyLocation[];
}

export interface INotifyCompany {
    objectId: string;
    name: string;
    floorIds: string[];
}

/// FloorMap
interface ISourceUnit {
    videoSourceType: string;
    videoSourceId: string;
    videoSourceName: string;
}
export interface ISource {
    eventSourceType: string;
    eventSourceId: string;
    eventSourceName: string;
    mainVideoSource: ISourceUnit;
    auxVideoSources: ISourceUnit[];
    type: string;
    x: number;
    y: number;
    angle: number;
}
export interface IFloorMap {
    objectId: string;
    imageSrc: string;
    location: ICompanyLocation;
    sources: ISource[];
}

export interface INotifyFloorMap {
    objectId: string;
    imageSrc: string;
    floorId: string;
    sources: ISource[];
}

/// CMS
export interface INotifyCMSDevice {
    objectId: string;
    name: string;
    serverId: string;
    floorId: string;
    sourceId: string;
    sourceName: string;
    sourceNvrNum: number;
    sourceChannelNum: number;
}

export interface ICMS extends IOLEDCMSs {
    objectId: string;
}

export interface ICMSDevice {
    objectId: string;
    name: string;
    server: {
        objectId: string;
        name?: string;
    };
    location: {
        floor: { objectId: string; name: string; },
        building: { objectId: string; name: string; }
    };
    sourceId: string;
    sourceName: string;
    sourceNvrNum: number;
    sourceChannelNum: number;
}

/// FRSM
export interface INotifyFRSMDevice {
    objectId: string;
    name: string;
    serverId: string;
    floorId: string;
    sourceId: string;
    sourceName: string;
}

export interface IFRSM extends IOLEDFRSMs {
    objectId: string;
}

export interface IFRSMDevice {
    objectId: string;
    name: string;
    server: {
        objectId: string;
        name?: string;
    };
    location: {
        floor: { objectId: string; name: string; },
        building: { objectId: string; name: string; }
    };
    sourceId: string;
    sourceName: string;
}

/// Outputs
export type IOutputBuilding = Restful.OutputR<IBuilding, { parseObject: false }>;
export type IOutputFloor = Restful.OutputR<IFloor, { parseObject: false }>;
export type IOutputCompany = Restful.OutputR<ICompany, { parseObject: false }>;
export type IOutputFloorMap = Restful.OutputR<IFloorMap, { parseObject: false }>;
export type IOutputCMS = Restful.OutputR<ICMS, { parseObject: false }>;
export type IOutputCMSDevice = Restful.OutputR<ICMSDevice, { parseObject: false }>;
export type IOutputFRSM = Restful.OutputR<IFRSM, { parseObject: false }>;
export type IOutputFRSMDevice = Restful.OutputR<IFRSMDevice, { parseObject: false }>;
