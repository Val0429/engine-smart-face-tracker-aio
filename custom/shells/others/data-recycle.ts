import ConfigManager from 'helpers/shells/config-manager';
import { ScheduleHelperV2 } from 'helpers/schedules/schedule-helper-v2';
import { EScheduleUnitRepeatType, EScheduleUnitRepeatEndType } from 'models/nodes/schedule';
import * as path from "path";
import * as fs from "fs";
const rimraf = require("rimraf");
import { Subscription } from 'rxjs';
import { Log } from 'helpers/utility';

const logTitle: string = "Data Recycle";
let started: boolean = false;
let prevDataRetensionDays: number;
let subscription: Subscription;

export function scheduleDataRecycle() {
    if (started) return;
    started = true;

    ConfigManager.observe("engine").subscribe(async function executeSFEConfig(config) {
        let dataRetensionDays = config.dataRetensionDays;
        if (prevDataRetensionDays === dataRetensionDays) return;
        prevDataRetensionDays = dataRetensionDays;
        if (subscription) subscription.unsubscribe();

        /// recycle snapshot image - daily
        subscription = ScheduleHelperV2.observe({
            beginDate: new Date(2000,0,1,0,0,0),
            endDate: new Date(2000,0,2,0,0,0),
            fullDay: true,
            repeat: {
                type: EScheduleUnitRepeatType.Day,
                value: 1,
                endType: EScheduleUnitRepeatEndType.NoStop,
            }
        })
        .subscribe(() => {
            let filePath = path.resolve(process.cwd(), "./workspace/custom/assets/snapshots");
            let expire = Math.floor(new Date().valueOf() / 1000) - dataRetensionDays * 24 * 60 * 60;

            fs.readdir(filePath, (err, files) => {
                let removals = files.filter(v => {
                    return expire >= +v;
                });
                removals.forEach(file => {
                    let thisPath = path.resolve(filePath, file);
                    Log.Info(logTitle, `path: ${thisPath}`);
                    rimraf(thisPath, { glob: false }, () => {});
                });
            });
        });
    });
}