import { Observable, Subject } from 'rxjs';
import { Semaphore } from 'helpers/utility/semaphore';
import * as request from 'request';
// import frs from './../frs-service';
import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import { IOutputPerson } from './core';
const mkdirp = require('mkdirp');

function getFile(value: IOutputPerson): Promise<IOutputPerson> {
    return new Promise<IOutputPerson>((resolve, reject) => {
        request({
            url: value.imageSrc, method: 'GET', encoding: null
        }, async (err, res, body) => {
            if (err || res.statusCode !== 200) {
                //reject(err || body.toString());
                /// keep original image
                resolve(value);
            } else {
                let timestamp = Math.floor(value.createdDate.valueOf() / 1000);
                timestamp -= timestamp % (24*60*60);
                let filename = path.basename(url.parse(value.imageSrc).pathname);
                let savePath = path.resolve(__dirname, `../../../assets/snapshots/${timestamp}`);
                /// promise exists
                let exists = await new Promise((resolve, reject) => {
                    fs.exists(savePath, resolve);
                });
                if (!exists) await mkdirp(savePath);
                let saveTo = path.resolve(savePath, filename);
                /// promise writeFile
                await new Promise((resolve, reject) => {
                    fs.writeFile(saveTo, body, "binary", (err) => resolve())
                });
                value.imageSrc = `snapshot/${timestamp}/${filename}`;
                value.imageLocal = true;
                resolve(value);
            }
        });
    });
}

export function saveSnapshot(asyncCount: number) {
    let lock: Semaphore = new Semaphore(asyncCount);

    return function(source): Observable<IOutputPerson> {
        return Observable.create( (subscriber) => {

            let subscription = source.subscribe( async (value: IOutputPerson) => {
                await lock.toPromise();
                {
                    await getFile(value);
                }
                lock.release();
                subscriber.next(value);
            });

        });
    }
}

