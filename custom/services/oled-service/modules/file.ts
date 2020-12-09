import { Response } from '~express/lib/response';
import { OledServer } from '../index';
import * as request from 'request';
import { RequestLoginReason } from '../libs/core';

import { IOutputBuilding, IOutputFloor, IOutputCompany, IOutputFloorMap } from "./core";

declare module "../" {
    interface OledServer {
        getFile(uri: string): Promise<Parse.File>;
    }
}

// interface ILocationAll {
//     <T>(this: OledServer, uri: string): Promise<T>;
//     call<T>(this: Function, ...args: any[]): Promise<T>;
// }
// const locationAll: ILocationAll = async function<T>(this: OledServer, uri: string): Promise<T> {
//     // await this.waitForLogin();
//     return new Promise<T>( (resolve, reject) => {
//         let body = {
//             sessionId: (this as any).sessionId,
//             paging: {
//                 page: 1,
//                 pageSize: 10000
//             }
//         };
//         let url: string = (this as any).makeUrl(uri, body);
    
//         request({
//             url, method: 'GET', json: true,
//             headers: { "Content-Type": "application/json" }
//         }, async (err, res, body) => {
//             if (err || res.statusCode !== 200) {
//                 reject(err || body.toString());
//                 if (res.statusCode === 401) {
//                     (this as any).sjRequestLogin.next(RequestLoginReason.SessionExpired);
//                 }
//             } else {
//                 resolve(body);
//             }
//         });
//     });
// }

OledServer.prototype.getFile = async function(this: OledServer, uri: string): Promise<Parse.File> {
    return new Promise<Parse.File>( (resolve, reject) => {
        let body = {
            sessionId: (this as any).sessionId
        };
        let url: string = (this as any).makeUrl(uri, body);
    
        request({
            url, method: 'GET', encoding: null
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    (this as any).sjRequestLogin.next(RequestLoginReason.SessionExpired);
                }
            } else {
                let file = new Parse.File("image.jpg", { base64: body.toString("base64") }, "image/jpeg");
                await file.save();
                resolve(file);
            }
        });
    });
}
