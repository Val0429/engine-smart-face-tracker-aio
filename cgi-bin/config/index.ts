/*
 * Created on Tue May 11 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, IConfig, Config, IConfigSetup,
    Action, Errors,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';
import ConfigManager from 'helpers/shells/config-manager';


var action = new Action({
    loginRequired: false
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
interface InputR {
    key?: string;
}
type OutputR = IConfig | IConfig[keyof IConfig];

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let { key } = data.inputType;
    let config = key ? Config[key] : Config;
    if (!config) throw Errors.throw(Errors.ParametersInvalid, ["key"]);
    return config;
});

/********************************
 * C: update object
 ********************************/
interface InputC {
    data: IConfigSetup;
}
type OutputC = any;
action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    var value = data.inputType.data;
    for (var key in value) {
        await ConfigManager.update(key as any, value[key]);
    }
    return value;
});
// /// CRUD end ///////////////////////////////////

export default action;
