import { app } from 'core/main.gen';

import './custom/shells/create-index';
import { Log, Level } from 'helpers/utility';
import { serverReady } from 'core/pending-tasks';
import { Cameras } from './custom/models';
import { ValFRSInit, ValRtspConnector, ValDisposeAll } from './custom/modules/valxnet';
import * as path from 'path';

import * as express from 'express';
// app.use('/files', express.static(`${__dirname}/custom/files`));
app.use('/snapshot', express.static(`${__dirname}/custom/assets/snapshots`));

Log.setLevel(Level.Trace);


console.time("Valxnet Initial Time");
ValFRSInit({
    paths: {
        db: path.resolve(__dirname, "./custom/modules/valxnet/build/data/val.bin"),
        model: path.resolve(__dirname, "./custom/modules/valxnet/build/Release")
    }
});
console.timeEnd("Valxnet Initial Time");

(async () => {
    await serverReady;
    Cameras.init();
    // let url = new URL("rtsp://172.16.10.122:756/Bao1");
    // let device = new ValRtspConnector({ ip: url.hostname, port: parseInt(url.port, 10), account: url.username, password: url.password, uri: url.pathname, ionly: true });
    // device.subscribe((streamObject) => {
    //     console.log("got frame");
    //     ValDisposeAll(streamObject);
    // });
    // device.Start();
})();
