import { Response } from '~express/lib/response';
import { OledServer } from '../index';
import * as request from 'request';
import { RequestLoginReason } from '../libs/core';

import { IOutputBuilding, IOutputFloor, IOutputCompany, IOutputFloorMap } from "./core";

declare module "../" {
    interface OledServer {
        getBuildings(): Promise<IOutputBuilding>;
        getFloors(): Promise<IOutputFloor>;
        getCompanies(): Promise<IOutputCompany>;
        getFloorMaps(): Promise<IOutputFloorMap>;
    }
}

interface ILocationAll {
    <T>(this: OledServer, uri: string): Promise<T>;
    call<T>(this: Function, ...args: any[]): Promise<T>;
}
const locationAll: ILocationAll = async function<T>(this: OledServer, uri: string): Promise<T> {
    // await this.waitForLogin();
    return new Promise<T>( (resolve, reject) => {
        let body = {
            sessionId: (this as any).sessionId,
            paging: {
                page: 1,
                pageSize: 10000
            }
        };
        let url: string = (this as any).makeUrl(uri, body);
    
        request({
            url, method: 'GET', json: true,
            headers: { "Content-Type": "application/json" }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    (this as any).sjRequestLogin.next(RequestLoginReason.SessionExpired);
                }
            } else {
                resolve(body);
            }
        });
    });
}

OledServer.prototype.getBuildings = async function(this: OledServer): Promise<IOutputBuilding> {
    const uri = "location/building";
    return locationAll.call<IOutputBuilding>(this, uri);
}

OledServer.prototype.getFloors = async function(this: OledServer): Promise<IOutputFloor> {
    const uri = "location/floor";
    return locationAll.call<IOutputFloor>(this, uri);
}

OledServer.prototype.getCompanies = async function(this: OledServer): Promise<IOutputCompany> {
    const uri = "location/company";
    return locationAll.call<IOutputCompany>(this, uri);
}

OledServer.prototype.getFloorMaps = async function(this: OledServer): Promise<IOutputFloorMap> {
    const uri = "location/floor-map";
    return locationAll.call<IOutputFloorMap>(this, uri);
}