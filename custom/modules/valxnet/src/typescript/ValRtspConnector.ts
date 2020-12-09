import Lib from "./lib";
import { ELogLevel, ISharedFrame } from "./core";

import { Subject, Observable, Subscription } from "rxjs";


interface IValRtspConnectorConfig {
    ip: string;
    port: number;
    account: string;
    password: string;
    uri: string;
    ionly?: boolean;
}

interface IValRtspConnectorCallback {
    (value: ISharedFrame): void;
}

export interface ValRtspConnector {
    new (config: IValRtspConnectorConfig): ValRtspConnector;

    Start();
    Stop();

    logLevel: ELogLevel;
    callback: IValRtspConnectorCallback;
    subscribe(callback: (ffObject: ISharedFrame) => void): Subscription;
}

Lib.ValRtspConnector.prototype.subscribe = function(callback) {
    let self: any = this;
    if (!this.callback) {
        self._sj = new Subject<ISharedFrame>();
        this.callback = (value) => {
            self._sj.next(value);
        }
    }
    return self._sj.subscribe(callback);
}

export var ValRtspConnector: ValRtspConnector = Lib.ValRtspConnector;
