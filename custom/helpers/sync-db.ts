import { sharedMongoDB } from "helpers/parse-server/parse-helper";
import { OLEDBuildings, OLEDFloors, OLEDCompanies, OLEDFloorMaps, OLEDCMSs, OLEDFRSMs } from "../models";
import { Log } from "helpers/utility";
import { IDifference_Building, IDifference_Company, IDifference_Floor, IDifference_FloorMap, IDifference_CMS, IDifference_FRSManager, IDifference_CMSDevice, IDifference_FRSMDevice } from "../services/oled-service/modules/difference";
import { IFloor, INotifyFloor, ICompany, INotifyCompany, INotifyFloorMap, IFloorMap, ICMSDevice, INotifyCMSDevice, INotifyFRSMDevice, IFRSMDevice } from "../services/oled-service/modules/core";
import { OledServer } from "workspace/custom/services/oled-service";
import { Subject } from "rxjs";
import { OLEDCMSDevices } from "../models/cms-device";
import { OLEDFRSMDevices } from "../models/frsm-device";

type Buildings = OLEDBuildings;
let Buildings = OLEDBuildings;
type Floors = OLEDFloors;
let Floors = OLEDFloors;
type Companies = OLEDCompanies;
let Companies = OLEDCompanies;
type FloorMaps = OLEDFloorMaps;
let FloorMaps = OLEDFloorMaps;

// export const sjDeletionMap: { [index: string]: Subject<string[]> } = {
//     OLEDFloors: new Subject<string[]>(),
//     OLEDCompanies: new Subject<string[]>(),
//     OLEDBuildings: new Subject<string[]>(),
//     OLEDFloorMaps: new Subject<string[]>(),
//     OLEDCMSs: new Subject<string[]>(),
//     OLEDFRSMs: new Subject<string[]>(),
//     OLEDCMSDevices: new Subject<string[]>(),
//     OLEDFRSMDevices: new Subject<string[]>()
// };

const handleList = [OLEDFloors, OLEDCompanies, OLEDBuildings, OLEDFloorMaps, OLEDCMSs, OLEDFRSMs, OLEDCMSDevices, OLEDFRSMDevices];
export let sjAddedMap: { [index: string]: Subject<any[]> } = {};
export let sjDeletionMap: { [index: string]: Subject<string[]> } = {};
for (let handle of handleList) {
    let name = handle.name;
    sjAddedMap[name] = new Subject<any[]>();
    sjDeletionMap[name] = new Subject<string[]>();
}

let buildingsMapping = {};
let floorsMapping = {};
let companiesMapping = {};
let floormapsMapping = {};
let cmssMapping = {};
let frsmanagersMapping = {};
let cmsdevicesMapping = {};
let frsmdevicesMapping = {};

/// deprecated
export async function syncAll(data: any[], Target: any, converter?: any) {
    /// remove all targets
    let targets = await new Parse.Query(Target).limit(1000).find();
    await Promise.all( targets.map( b => b.destroy()) );

    /// insert all targets
    let newtargets = data;
    let targetObjects = newtargets.map( nb => {
        let objectId = nb.objectId;
        delete nb.objectId;
        let tmp = converter ? converter(nb) : new Target(nb);
        (tmp as any).tmpId = objectId;
        return tmp;
    });
    await Parse.Object.saveAll(targetObjects);

    /// mapping keys
    let keyMappings = targetObjects.reduce( (final, value) => {
        final[value.id] = (value as any).tmpId;
        return final;
    }, {} as any);

    /// update objectId
    let db = await sharedMongoDB();
    let col = db.collection(Target.name);
    let utargets = await col.find().toArray();
    await col.insertMany( utargets.map( ub => { ub._id = keyMappings[ub._id]; return ub; } ) );

    /// clean up
    Parse.Object.destroyAll(targetObjects);    
}

export async function handleDeleted(col: any, deleted: any[], Target: any, converter?: any) {
    if (deleted.length === 0) return;
    deleted = deleted.map((nb) => typeof(nb) === "string" ? nb : nb.objectId);
    sjDeletionMap[Target.name].next(deleted);
    return col.deleteMany({ _id: { $in: deleted } });
}

export async function handleModified(col: any, modified: any[], Target: any, converter?: any) {
    if (modified.length === 0) return;

    let deleted = modified.map((nb) => nb.objectId);
    await handleDeleted(col, deleted, Target, converter);
    return await handleAdded(col, modified, Target, converter);
}

export async function handleAdded(col: any, added: any[], Target: any, converter?: any) {
    if (added.length === 0) return;
    let ids = [];
    let targetObjects = [];
    for (let nb of added) {
        let objectId = nb.objectId;
        let nnb = {
            ...nb,
            createdAt: nb.createdDate,
            updatedAt: nb.updatedDate
        }
        let { createdAt, updatedAt } = nnb;
        delete nnb.objectId;
        delete nnb.createdDate;
        delete nnb.updatedDate;
        let tmp = converter ? new Target(await converter(nnb)) : new Target(nnb);
        (tmp as any).tmpId = objectId;
        (tmp as any).tmpCreatedAt = createdAt;
        (tmp as any).tmpUpdatedAt = updatedAt;
        targetObjects.push(tmp);
    }
    await Parse.Object.saveAll(targetObjects);

    /// mapping keys
    let keyMappings = targetObjects.reduce( (final, value) => {
        ids.push(value.id);
        final[value.id] = value;
        return final;
    }, {} as any);

    /// update objectId
    let utargets = await col.find({ _id: { $in: ids } }).toArray();
    let ftargets = utargets.map( ub => {
        let mapping = keyMappings[ub._id];
        ub._id = mapping.tmpId;
        ub._created_at = mapping.tmpCreatedAt;
        ub._updated_at = mapping.tmpUpdatedAt;
        return ub;
    } );
    await col.insertMany(ftargets);

    sjAddedMap[Target.name].next( ftargets.map( ub => {
        return {
            objectId: ub._id,
            ...ub
        }
    }) );

    /// clean up
    return Parse.Object.destroyAll(targetObjects);
}

/// db: the class object
export async function syncDB(data: any[], Target: any, converter?: any) {
    let collectionName: string = Target.name;
    let added: any[] = [];
    let modified: any[] = [];
    let deleted: string[] = [];

    /// 1) detect add / modify / delete
    let db = await sharedMongoDB();
    let col = db.collection(collectionName);
    
    /// 2) get current mapping
    let currentMap = (await col.find().project({ _updated_at: 1 }).toArray()).reduce( (final, value) => {
        final[value._id] = value;
        /// convert date
        value.updatedDate = new Date(value.updatedDate);
        value.createdDate = new Date(value.createdDate);
        return final;
    }, {});

    /// 3) get target mapping
    let targetMap = data.reduce( (final, value) => {
        let id = value.objectId;
        final[id] = value;

        let currentObject = currentMap[id];
        if (!currentObject) {
            /// 4) find added: where `objectId` cannot be found in currentMap
            added.push(value);
        } else if (value.updatedDate > currentObject._updated_at) {
            /// 5) find modified: where `objectId` can be found in currentMap, but _updated_at mismatch
            modified.push(value);
        }
        return final;
    }, {});

    /// 6) find deleted: where `objectId` exists in currentMap but not targetMap
    deleted = Object.keys(currentMap).reduce( (final, key) => {
        if (!targetMap[key]) final.push(key);
        return final;
    }, []);

    // console.log("added: ", added);
    // console.log("modified: ", modified);
    // console.log("deleted: ", deleted);

    /// A) Handle added
    if (added.length > 0) {
        let pt = Log.InfoTime(`Sync ${collectionName}`, `Added ${added.length} rows.`);
        await handleAdded(col, added, Target, converter);
        pt.end();
    }
    /// B) Handle modifed
    if (modified.length > 0) {
        let pt = Log.InfoTime(`Sync ${collectionName}`, `Modified ${modified.length} rows.`);
        await handleModified(col, modified, Target, converter);
        pt.end();
    }
    /// C) Handle deleted
    if (deleted.length > 0) {
        let pt = Log.InfoTime(`Sync ${collectionName}`, `Deleted ${deleted.length} rows.`);
        await handleDeleted(col, deleted, Target, converter);
        pt.end();
    }

    return targetMap;
}

// interface IDifference_Base {
//     type: 'c' | 'u' | 'd';
// }
// interface IDifference_Building extends IDifference_Base {
//     topic: 'building';
//     content: IOutputBuilding;
// }
// interface IDifference_Floor extends IDifference_Base {
//     topic: 'floor';
//     content: IOutputFloor;
// }
// interface IDifference_Company extends IDifference_Base {
//     topic: 'company';
//     content: IOutputCompany;
// }
export function updateMapping(data: IDifference_Building | IDifference_Floor | IDifference_Company | IDifference_FloorMap | IDifference_CMS | IDifference_FRSManager | IDifference_CMSDevice | IDifference_FRSMDevice) {
    let type = data.type;
    let topic = data.topic;
    let content = data.content;
    let mapping = topic === "building" ? buildingsMapping :
        topic === "floor" ? floorsMapping :
        topic === "company" ? companiesMapping :
        topic === "floor-map" ? floormapsMapping :
        topic === "cms" ? cmssMapping :
        topic === "frsm" ? frsmanagersMapping :
        topic === "cms-device" ? cmsdevicesMapping :
        topic === "frsm-device" ? frsmdevicesMapping :
        null;
    switch (type) {
        case "c":
        case "u":
            mapping[content.objectId] = content;
            break;
        case "d":
            delete mapping[content.objectId];
            break;
    }
}

export async function sync1Buildings(data: any[]) {
    buildingsMapping = await syncDB(data, Buildings);
}

export function syncFloorConverter(value) {
    let buildingId = value.building.objectId;
    let building = null;
    if (buildingsMapping[buildingId]) {
        building = new Buildings();
        building.id = value.building.objectId;
    }
    value.building = building;
    return value;
}

export async function sync2Floors(data: any[]) {
    floorsMapping = await syncDB(data, Floors, syncFloorConverter);
}

export function syncCompanyConverter(value) {
    if (value.locations) {
        value.locations = value.locations.map( (location) => {
            let building = null;
            let floor = null;
            let building_id = location.building.objectId;
            let floor_id = location.floor.objectId;
            let mapBuilding = buildingsMapping[building_id];
            let mapFloor = floorsMapping[floor_id];
            if (mapBuilding) {
                building = new Buildings();
                building.id = building_id;
            }
            if (mapFloor) {
                floor = new Floors();
                floor.id = floor_id;
            }
            location.building = building;
            location.floor = floor;
            return location;
        });
    }
    return value;
}

export async function sync3Companies(data: any[]) {
    companiesMapping = await syncDB(data, Companies, syncCompanyConverter);
}

export async function syncFloorMapConverter(value) {
    /// download image src
    if (value.imageSrc) {
        let oledServer = await OledServer.sharedInstance();
        value.imageSrc = await oledServer.getFile(value.imageSrc);
    }
    if (value.location) {
        value.location = [value.location].map( (location) => {
            let building = null;
            let floor = null;
            let building_id = location.building.objectId;
            let floor_id = location.floor.objectId;
            let mapBuilding = buildingsMapping[building_id];
            let mapFloor = floorsMapping[floor_id];
            if (mapBuilding) {
                building = new Buildings();
                building.id = building_id;
            }
            if (mapFloor) {
                floor = new Floors();
                floor.id = floor_id;
            }
            location.building = building;
            location.floor = floor;
            return location;
        })[0];
    }
    
    value.sources = (value.sources || []).map((source) => {
        /// convert eventSource
        switch (source.eventSourceType) {
            case "cms":
                source.eventSourceCMSDevice = new OLEDCMSDevices();
                source.eventSourceCMSDevice.id = source.eventSourceId;
                break;
            case "frsm":
                source.eventSourceFRSMDevice = new OLEDFRSMDevices();
                source.eventSourceFRSMDevice.id = source.eventSourceId;
                break;
            default:
                throw `Error: unknown floorMap eventSourceType: ${source.eventSourceType}`;
        }

        const convertISourceUnit = (sourceunit) => {
            if (!sourceunit) return;
            if (sourceunit.videoSourceType !== "cms") throw `Error: unknown floorMap videoSourceType: ${sourceunit.videoSourceType}`;
            sourceunit.videoSourceCMSDevice = new OLEDCMSDevices();
            sourceunit.videoSourceCMSDevice.id = sourceunit.videoSourceId;
            if (!cmsdevicesMapping[sourceunit.videoSourceId]) throw `Error: cms device not exists! ${sourceunit.videoSourceId}`;
            return sourceunit;
        }
        source.mainVideoSource = convertISourceUnit(source.mainVideoSource);
        source.auxVideoSources = (source.auxVideoSources||[]).map(src => convertISourceUnit(src));
        return source;
    });

    return value;
}

export async function sync4CMSs(data: any[]) {
    cmssMapping = await syncDB(data, OLEDCMSs);
}
export async function sync4CMSDevices(data: any[]) {
    cmsdevicesMapping = await syncDB(data, OLEDCMSDevices, syncCMSDeviceConverter);
}
export async function syncCMSDeviceConverter(value) {
    if (value.server) {
        let id = value.server.objectId;
        value.server = new OLEDCMSs();
        value.server.id = id;
    }
    if (value.location) {
        value.location = [value.location].map( (location) => {
            let building = null;
            let floor = null;
            let building_id = location.building.objectId;
            let floor_id = location.floor.objectId;
            let mapBuilding = buildingsMapping[building_id];
            let mapFloor = floorsMapping[floor_id];
            if (mapBuilding) {
                building = new Buildings();
                building.id = building_id;
            }
            if (mapFloor) {
                floor = new Floors();
                floor.id = floor_id;
            }
            location.building = building;
            location.floor = floor;
            return location;
        })[0];
    }
    return value;
}

export async function syncFRSMDeviceConverter(value) {
    if (value.server) {
        let id = value.server.objectId;
        value.server = new OLEDFRSMs();
        value.server.id = id;
    }
    if (value.location) {
        value.location = [value.location].map( (location) => {
            let building = null;
            let floor = null;
            let building_id = location.building.objectId;
            let floor_id = location.floor.objectId;
            let mapBuilding = buildingsMapping[building_id];
            let mapFloor = floorsMapping[floor_id];
            if (mapBuilding) {
                building = new Buildings();
                building.id = building_id;
            }
            if (mapFloor) {
                floor = new Floors();
                floor.id = floor_id;
            }
            location.building = building;
            location.floor = floor;
            return location;
        })[0];
    }
    return value;
}

export async function sync5FRSMs(data: any[]) {
    frsmanagersMapping = await syncDB(data, OLEDFRSMs);
}
export async function sync5FRSMDevices(data: any[]) {
    frsmdevicesMapping = await syncDB(data, OLEDFRSMDevices, syncFRSMDeviceConverter);
}

export async function sync6FloorMaps(data: any[]) {
    floormapsMapping = await syncDB(data, FloorMaps, syncFloorMapConverter);
}

// export interface IFloor {
//     objectId: string;
//     building: IBuilding;
//     name: string;
//     level: number;
// }

// export interface INotifyFloor {
//     objectId: string;
//     buildingId: string;
//     name: string;
//     level: number;
// }
export function notifyFloorToNormal(floor: INotifyFloor): IFloor {
    let rtnFloor: IFloor = {
        ...floor,
        building: {
            objectId: floor.buildingId
        } as any,
    }
    delete (rtnFloor as any).buildingId;
    return rtnFloor;
}

// interface ICompanyLocation {
//     floor: IFloor;
//     building: IBuilding;
// }

// export interface ICompany {
//     objectId: string;
//     name: string;
//     locations: ICompanyLocation[];
// }

// export interface INotifyCompany {
//     objectId: string;
//     name: string;
//     floorIds: string[];
// }
export function notifyCompanyToNormal(company: INotifyCompany): ICompany {
    let rtnCompany: ICompany = {
        ...company,
        locations: company.floorIds.reduce((final, value) => {
            final.push({
                floor: { objectId: value },
                building: { objectId: ((floorsMapping[value]||{}).building||{}).objectId },
            });
            return final;
        }, []) as any,
    }
    delete (rtnCompany as any).floorIds;
    return rtnCompany;
}

// /// FloorMap
// interface ISourceUnit {
//     videoSourceType: string;
//     videoSourceId: string;
//     videoSourceName: string;
// }
// interface ISource {
//     eventSourceType: string;
//     eventSourceId: string;
//     eventSourceName: string;
//     mainVideoSource: ISourceUnit;
//     auxVideoSources: ISourceUnit[];
//     type: string;
//     x: number;
//     y: number;
//     angle: number;
// }
// export interface IFloorMap {
//     objectId: string;
//     imageSrc: string;
//     location: ICompanyLocation;
//     sources: ISource[];
// }

// export interface INotifyFloorMap {
//     objectId: string;
//     imageSrc: string;
//     floorId: string;
//     sources: ISource[];
// }
export function notifyFloorMapToNormal(floormap: INotifyFloorMap): IFloorMap {
    let rtnFloorMap: IFloorMap = {
        ...floormap,
        sources: floormap.sources.map(source => {
            return {
                ...source,
                eventSourceName: (source.eventSourceType === "cms" ? cmsdevicesMapping : frsmdevicesMapping)[source.eventSourceId].name
            }
        }),
        location: ([floormap.floorId].reduce((final, value) => {
            final.push({
                floor: { objectId: value },
                building: { objectId: ((floorsMapping[value]||{}).building||{}).objectId },
            });
            return final;
        }, []) as any)[0],
    }
    return rtnFloorMap;
}

export function notifyCMSDeviceToNormal(device: INotifyCMSDevice): ICMSDevice {
    let rtnDevice: ICMSDevice = {
        ...device,
        server: { objectId: device.serverId },
        location: ([device.floorId].reduce((final, value) => {
            final.push({
                floor: { objectId: value },
                building: { objectId: ((floorsMapping[value]||{}).building||{}).objectId },
            });
            return final;
        }, []) as any)[0],
    }
    return rtnDevice;
}

export function notifyFRSMDeviceToNormal(device: INotifyFRSMDevice): IFRSMDevice {
    let rtnDevice: IFRSMDevice = {
        ...device,
        server: { objectId: device.serverId },
        location: ([device.floorId].reduce((final, value) => {
            final.push({
                floor: { objectId: value },
                building: { objectId: ((floorsMapping[value]||{}).building||{}).objectId },
            });
            return final;
        }, []) as any)[0],
    }
    return rtnDevice;
}
