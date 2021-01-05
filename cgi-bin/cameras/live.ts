/*
 * Created on Tue Nov 13 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, sjCameraLive, Log,
} from 'core/cgi-package';

const logTitle: string = "CameraLiveConnection";

export default new Action<any>({
    loginRequired: false
})
.ws(async (data) => {
    let socket = data.socket;

    Log.Trace(logTitle, "Connected.");
    let subscription = sjCameraLive.subscribe((live) => {
        try {
            socket.send( JSON.stringify(live) );
        } catch(e) { /* socket closed */ }
    });

    socket.io.on("close", () => {
        Log.Trace(logTitle, "Closed.");
        subscription.unsubscribe();
    });
    socket.io.on("error", () => {
        Log.Trace(logTitle, "Error.");
        subscription.unsubscribe();
    });

});
