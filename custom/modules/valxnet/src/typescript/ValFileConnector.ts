import Lib from "./lib";
import { ELogLevel, ISharedFrame } from "./core";

import { Subject, Observable, Subscription } from "rxjs";


interface IValFileConnectorConfig {
    path: string;
    ionly?: boolean;
    decodeAll?: boolean;
}

interface IValFileConnectorCallback {
    (value: ISharedFrame): void;
}

interface IValFileConnectorCallbackError {
    (message: string): void;
}

interface IValFileConnectorCallbackComplete {
    (): void;
}

export interface ValFileConnector {
    new (config: IValFileConnectorConfig): ValFileConnector;

    Start();
    Stop();
    Next();

    logLevel: ELogLevel;
    callback: IValFileConnectorCallback;
    callbackError: IValFileConnectorCallbackError;
    callbackComplete: IValFileConnectorCallbackComplete;
    subscribe(
        callback: (ffObject: ISharedFrame) => void,
        callbackError?: IValFileConnectorCallbackError,
        callbackComplete?: IValFileConnectorCallbackComplete
        ): Subscription;
}

Lib.ValFileConnector.prototype.subscribe = function(callback, callbackError, callbackComplete) {
    let self: any = this;
    if (!this.callback) {
        self._sj = new Subject<ISharedFrame>();
        this.callback = (value) => {
            self._sj.next(value);
        }
    }
    if (callbackError && !this.callbackError) {
        this.callbackError = (message) => {
            callbackError(message);
        }
    }
    if (callbackComplete && !this.callbackComplete) {
        this.callbackComplete = () => {
            callbackComplete();
        }
    }

    return self._sj.subscribe(callback);
}

export var ValFileConnector: ValFileConnector = Lib.ValFileConnector;
