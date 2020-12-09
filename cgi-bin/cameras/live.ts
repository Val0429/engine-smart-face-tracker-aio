/*
 * Created on Tue Nov 13 2020
 * Author: Val Liu
 * Copyright (c) 2020, iSAP Solution
 */

import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, sjCameraLive,
} from 'core/cgi-package';

export default new Action<any>({
    loginRequired: false
})
.ws(async (data) => {
    let socket = data.socket;

    let subscription = sjCameraLive.subscribe((live) => {
        try {
            socket.send( JSON.stringify(live) );
        } catch(e) { /* socket closed */ }
    });

    socket.io.on("close", () => {
        subscription.unsubscribe();
    });

});
