import { Response } from '~express/lib/response';
import { FRSManagerServer } from '../index';
import * as request from 'request';
import { RequestLoginReason } from '../libs/core';

import { IOutputPersonTag, IPersonTag } from "./core";

declare module "../" {
    interface FRSManagerServer {
        getPersonTags(params?: any): Promise<IOutputPersonTag>;
        createPersonTag(name: string): Promise<IPersonTag>;
    }
}

FRSManagerServer.prototype.createPersonTag = async function(name: string): Promise<IPersonTag> {
    const uri = "person/tag";
    await this.waitForLogin();
    return new Promise<IPersonTag>( (resolve, reject) => {
        let params = {
            sessionId: (this as any).sessionId,
            datas: [
                { name }
            ]
        };
        let url: string = (this as any).makeUrl(uri);

        request({
            url, method: 'POST', body: params, json: true,
            headers: { "Content-Type": "application/json" }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    (this as any).sjRequestLogin.next(RequestLoginReason.SessionExpired);
                }
            } else {
                resolve(body.datas[0]);
            }
        });
    });
}

FRSManagerServer.prototype.getPersonTags = async function(params?: any): Promise<IOutputPersonTag> {
    const uri = "person/tag";
    await this.waitForLogin();
    return new Promise<IOutputPersonTag>( (resolve, reject) => {
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
