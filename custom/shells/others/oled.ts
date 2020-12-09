import { OledServer } from "workspace/custom/services/oled-service";
import { ConfigManager } from "helpers/shells/config-manager";
import { sync1Buildings, sync2Floors, sync3Companies, handleAdded, syncFloorConverter, syncCompanyConverter, handleModified, handleDeleted, updateMapping, sjDeletionMap, notifyFloorToNormal, notifyCompanyToNormal, sync6FloorMaps, syncFloorMapConverter, notifyFloorMapToNormal, sync4CMSs, sync5FRSMs, sync4CMSDevices, sync5FRSMDevices, notifyFRSMDeviceToNormal, notifyCMSDeviceToNormal, syncCMSDeviceConverter, syncFRSMDeviceConverter } from "workspace/custom/helpers/sync-db";
import { SymbolDisconnected, SymbolSessionKickedOut, SymbolReconnected } from "workspace/custom/helpers/vwebsocket";
import { Log, Mutex } from "helpers/utility";
import { OLEDBuildings, OLEDFloors, OLEDCompanies, OLEDFloorMaps, OLEDFRSMs, OLEDCMSs } from "workspace/custom/models";
import { sharedMongoDB } from "helpers/parse-server/parse-helper";
import { OLEDCMSDevices } from "workspace/custom/models/cms-device";
import { OLEDFRSMDevices } from "workspace/custom/models/frsm-device";

export async function startOLED() {
    let CM = ConfigManager.getInstance();
    let mutex = new Mutex();
    
    /// oled server
    let oledServer = await OledServer.sharedInstance();
    /// resync all
    const resyncAll = async () => {
        let [buildings, floors, companies, floormaps, cmss, cmsdevices, frsms, frsmdevices] = await Promise.all([
            oledServer.getBuildings(),
            oledServer.getFloors(),
            oledServer.getCompanies(),
            oledServer.getFloorMaps(),
            oledServer.getCMSs(),
            oledServer.getCMSDevices(),
            oledServer.getFRSMs(),
            oledServer.getFRSMDevices()
        ]);
        let pt = Log.InfoTime("OLED Diff", "Sync All Completed.");
        await sync1Buildings(buildings.results);
        await sync2Floors(floors.results);
        await sync3Companies(companies.results);
        await sync4CMSs(cmss.results);
        await sync4CMSDevices(cmsdevices.results);
        await sync5FRSMs(frsms.results);
        await sync5FRSMDevices(frsmdevices.results);
        await sync6FloorMaps(floormaps.results);
        pt.end();
    };
    (async () => {
        let db = await sharedMongoDB();

        /// hook OledServer WS
        const isSymbol = (data): data is Symbol => typeof(data) === "symbol";
        oledServer.getDifferences()
            .subscribe( async (data) => {
                await mutex.acquire();
                switch (data) {
                    case SymbolDisconnected:
                    case SymbolSessionKickedOut:
                        break;
                    case SymbolReconnected:
                        resyncAll();
                        break;
                    default:
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
                        if (!isSymbol(data)) {
                            console.log("got notify!!!", JSON.stringify(data));
                            do {
                                let type = data.type;
                                let topic = data.topic;
                                let Target = topic === "building" ? OLEDBuildings :
                                    topic === "floor" ? OLEDFloors :
                                    topic === "company" ? OLEDCompanies :
                                    topic === "floor-map" ? OLEDFloorMaps :
                                    topic === "cms" ? OLEDCMSs :
                                    topic === "frsm" ? OLEDFRSMs :
                                    topic === "cms-device" ? OLEDCMSDevices :
                                    topic === "frsm-device" ? OLEDFRSMDevices :
                                    null;
                                /// unhandled topic type
                                //if (Target === null) throw `OLED unknown topic: ${topic}`;
                                if (Target === null) break;
                                let converter = topic === "building" ? null :
                                    topic === "floor" ? syncFloorConverter :
                                    topic === "company" ? syncCompanyConverter :
                                    topic === "floor-map" ? syncFloorMapConverter :
                                    topic === "cms-device" ? syncCMSDeviceConverter :
                                    topic === "frsm-device" ? syncFRSMDeviceConverter :
                                    null;
                                let content = topic === "building" ? data.content :
                                    topic === "floor" ? notifyFloorToNormal(data.content as any) :
                                    topic === "company" ? notifyCompanyToNormal(data.content as any) :
                                    topic === "floor-map" ? notifyFloorMapToNormal(data.content as any) :
                                    topic === "cms" ? data.content :
                                    topic === "frsm" ? data.content :
                                    topic === "cms-device" ? notifyCMSDeviceToNormal(data.content as any) :
                                    topic === "frsm-device" ? notifyFRSMDeviceToNormal(data.content as any) :
                                    null;
                                data.content = content;
    
                                let collectionName: string = Target.name;
                                let col = db.collection(collectionName);
                                switch (type) {
                                    case "c":
                                        await handleAdded(col, [content], Target, converter);
                                        updateMapping(data);
                                        break;
                                    case "u":
                                        await handleModified(col, [content], Target, converter);
                                        updateMapping(data);
                                        break;
                                    case "d":
                                        await handleDeleted(col, [content], Target, converter);
                                        updateMapping(data);
                                        break;
                                    default:
                                        throw `OLED unknown type: ${type}`;
                                }

                            } while(0);

                        }
                        break;
                }
                mutex.release();
            });
    })();

}

