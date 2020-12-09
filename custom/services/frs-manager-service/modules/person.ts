import { Response } from '~express/lib/response';
import { FRSEdgeServer } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from '../libs/core';
import { reject, resolve } from 'bluebird';

interface IFilterPerson {
    objectId: string;
}

interface IPersonGroup {
    objectId: string;
    name: string;
}

export interface IOutputPerson {
    objectId: string;
    imageSrc: string;
    imageOriginalSrc: string;
    groups?: IPersonGroup[];
}

declare module "services/edge-server" {
    interface FRSEdgeServer {
        getPerson(face: IFilterPerson, times?: number): Promise<IOutputPerson>;
        getPersonImage(face: IFilterPerson, times?: number): Promise<Buffer>;
    }
}

const uri = "person";
FRSEdgeServer.prototype.getPerson = async function(face: IFilterPerson, times: number = 1): Promise<IOutputPerson> {
    return retry<IOutputPerson>( async (resolve, reject) => {
        await this.waitForLogin();

        (face as any).sessionId = this.sessionId;
        let params = Object.keys(face).map( (k) => `${k}=${encodeURI(face[k])}` ).join("&");
        let url: string = `${this.makeUrl(uri)}?${params}`;

        request({
            url, method: 'GET', json: true,
            headers: { "Content-Type": "application/json" }
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                reject(err || body.toString());
                if (res.statusCode === 401) {
                    this.sjRequestLogin.next(RequestLoginReason.SessionExpired);
                    await this.waitForLogin();
                }
                return;
            }

            resolve(body);
        });
    }, times, "FRSEdgeServer.getPerson");
}

FRSEdgeServer.prototype.getPersonImage = async function(face: IFilterPerson, times: number = 1): Promise<Buffer> {
    let person: IOutputPerson = await this.getPerson(face, times);
    
    return new Promise<Buffer>((resolve, reject) => {
        request({
            url: `${this.makeUrl()}${person.imageOriginalSrc}`,
            method: 'GET',
            headers: { "Content-Type": "application/json" },
            encoding: null
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                return reject(err || body.toString());
            }
            resolve(body as any);
        });
    });
}
