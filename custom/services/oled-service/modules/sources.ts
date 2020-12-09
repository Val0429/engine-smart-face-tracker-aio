import { Response } from '~express/lib/response';
import { OledServer } from '../index';
import * as request from 'request';
import { RequestLoginReason } from '../libs/core';

import { IOutputBuilding, IOutputFloor, IOutputCompany, IOutputFloorMap, IOutputCMS, IOutputFRSM, IOutputCMSDevice, IOutputFRSMDevice } from "./core";

declare module "../" {
    interface OledServer {
        getCMSs(): Promise<IOutputCMS>;
        getCMSDevices(): Promise<IOutputCMSDevice>;
        getFRSMs(): Promise<IOutputFRSM>;
        getFRSMDevices(): Promise<IOutputFRSMDevice>;
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

OledServer.prototype.getCMSs = async function(this: OledServer): Promise<IOutputCMS> {
    const uri = "source/cms";
    return locationAll.call<IOutputCMS>(this, uri);
}
OledServer.prototype.getCMSDevices = async function(this: OledServer): Promise<IOutputCMSDevice> {
    const uri = "source/cms-device";
    return locationAll.call<IOutputCMSDevice>(this, uri);
}

OledServer.prototype.getFRSMs = async function(this: OledServer): Promise<IOutputFRSM> {
    const uri = "source/frsm";
    return locationAll.call<IOutputFRSM>(this, uri);
}
OledServer.prototype.getFRSMDevices = async function(this: OledServer): Promise<IOutputFRSMDevice> {
    const uri = "source/frsm-device";
    return locationAll.call<IOutputFRSMDevice>(this, uri);
}
