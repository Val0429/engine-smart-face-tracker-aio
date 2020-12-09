import { Response } from '~express/lib/response';
import { FRSManagerServer } from '../index';
import * as request from 'request';
import { RequestLoginReason } from '../libs/core';

import { IOutputPersonVisitor, IPersonVisitor } from "./core";

export enum EEntryMode {
    single = 1,
    multiple,
}

interface ICreatePersonVisitor {
    imageBase64: string;
    companyId: string;
    visitorCompanyName: string;
    floorIds: string[];
    accessGroupIds: string[];
    name: string;
    tagId?: string;
    position?: string;
    endDate: Date;
    entryMode: EEntryMode;
}

declare module "../" {
    interface FRSManagerServer {
        getPersonVisitors(params?: any): Promise<IOutputPersonVisitor>;
        createPersonVisitor(data: ICreatePersonVisitor): Promise<IPersonVisitor>;
    }
}

FRSManagerServer.prototype.createPersonVisitor = async function(data: ICreatePersonVisitor): Promise<IPersonVisitor> {
    const uri = "person/visitor";
    await this.waitForLogin();
    return new Promise<IPersonVisitor>( (resolve, reject) => {
        let params = {
            sessionId: (this as any).sessionId,
            datas: [
                data
            ]
        };
        let url: string = (this as any).makeUrl(uri);

        request({
            url, method: 'POST', json: true, body: params,
            headers: { "Content-Type": "application/json" }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    (this as any).sjRequestLogin.next(RequestLoginReason.SessionExpired);
                }
            } else {
                let row = body.datas[0];
                if (row.statusCode !== 200) reject(JSON.stringify(row));
                resolve(row);
            }
        });
    });
}

FRSManagerServer.prototype.getPersonVisitors = async function(params?: any): Promise<IOutputPersonVisitor> {
    const uri = "person/visitor";
    await this.waitForLogin();
    return new Promise<IOutputPersonVisitor>( (resolve, reject) => {
        if (!params) params = {};
        params.sessionId = (this as any).sessionId;
        let url: string = (this as any).makeUrl(uri, params);
    
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
                if (!body.results) body = { results: [body] };
                resolve(body);
            }
        });
    });    
}
