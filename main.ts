import { app } from 'core/main.gen';

import './custom/shells/create-index';
import { Log, Level } from 'helpers/utility';
import { serverReady } from 'core/pending-tasks';
import { Cameras } from './custom/models';
import { ValFRSInit, ValRtspConnector, ValDisposeAll } from './custom/modules/valxnet';
import * as path from 'path';

import * as express from 'express';
import { scheduleDataRecycle } from './custom/shells/others/data-recycle';
// app.use('/files', express.static(`${__dirname}/custom/files`));
// app.use('/snapshot', express.static(`${__dirname}/custom/assets/snapshots`));
app.use('/snapshot', express.static(path.resolve(process.cwd(), "./workspace/custom/assets/snapshots")));

Log.setLevel(Level.Trace);


console.time("Valxnet Initial Time");
ValFRSInit({
    paths: {
        db: path.resolve(process.cwd(), "./workspace/custom/modules/valxnet/build/data/val.bin"),
        model: path.resolve(process.cwd(), "./workspace/custom/modules/valxnet/build/Release")
    }
});
console.timeEnd("Valxnet Initial Time");

(async () => {
    await serverReady;
    Cameras.init();
    scheduleDataRecycle();
})();
