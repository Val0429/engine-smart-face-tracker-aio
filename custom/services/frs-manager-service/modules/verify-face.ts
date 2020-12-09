import { Response } from '~express/lib/response';
import { FRSEdgeServer } from './../index';
import * as request from 'request';
import { retry } from 'helpers/utility/retry';
import { RecognizedUser, UnRecognizedUser, RequestLoginReason } from './../libs/core';

interface IVerifyFaceOptions {
    threshold?: number;
    hasReport?: boolean;
}

interface ISettingFREngine {
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    wsPort: number;
    account?: string;
    password?: string;
}

interface IVerifyFace {
    imageBase64: Buffer | string;
    options?: IVerifyFaceOptions;
    config?: ISettingFREngine;
}

interface IVerifyFacePersonGroup {
    objectId: string;
    name: string;
}

export interface IOutputVerifyFace {
    personId: string;
    personEngineId: string;
    personName: string;
    personCard: string;
    personPassword: string;
    personImageOriginalSrc: string;
    personGroups: IVerifyFacePersonGroup[];
    score: number;
    threshold: number;
    date: Date;
    isMatch: boolean;
}

declare module "services/edge-server" {
    interface FRSEdgeServer {
        verifyFace(face: IVerifyFace, times?: number): Promise<IOutputVerifyFace>;
    }
}

const uri = "frengine/verify-face";
FRSEdgeServer.prototype.verifyFace = async function(face: IVerifyFace, times: number = 1): Promise<IOutputVerifyFace> {
    return retry<IOutputVerifyFace>( async (resolve, reject) => {
        await this.waitForLogin();

        face.imageBase64 = face.imageBase64 instanceof Buffer ? face.imageBase64.toString("base64") : face.imageBase64;

        let url: string = this.makeUrl(uri);
        (face as any).sessionId = this.sessionId;
        request({
            url, method: 'POST', json: true,
            headers: { "Content-Type": "application/json" },
            body: face
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
    }, times, "FRSEdgeServer.verifyFace");
}

