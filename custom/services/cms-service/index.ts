import * as request from 'request';
import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { Log } from 'helpers/utility';
import { Config } from 'core/config.gen';
import { LogTitle, ServerKey, IServerConfig, IServerCoreConfig, RequestLoginReason } from './libs/core';
import ConfigManager from 'helpers/shells/config-manager';
import { CryptoService } from './libs/crypto';

class Reconnector {
    private callback: any;
    private timer: any;
    constructor(callback: any) {
        this.callback = callback;
    }
    public start() {
        if (this.timer) return;
        this.timer = setInterval(this.callback, 1000);
    }
    public stop() {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
    }
}

/**
 * Submodules should take this into consideration:
 * 1) sjLogined
 * 2) sjStarted
 * 3) config.debug
 * 4) when request failed do retry
 * 5) timeout handle
 */

export class CMSServer {
    private sessionId: string;
    /// started or not
    private sjStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    /// login or not
    private sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    /// request for relogin
    private sjRequestLogin: Subject<RequestLoginReason> = new Subject<RequestLoginReason>();
    private config: IServerConfig;
    private loginUri: string = "web/login";
    private reconnector: Reconnector;
    static initializer: ((this: CMSServer) => void)[] = [];

    // /// use for fixed config frs
    // private static _sharedInstance: CMSServer;
    // static async sharedInstance(): Promise<CMSServer> {
    //     await ConfigManager.ready(ServerKey);
    //     if (this._sharedInstance) return this._sharedInstance;
    //     this._sharedInstance = new FRSManagerServer({
    //         debug: true,
    //         server: Config[ServerKey]
    //     });
    //     this._sharedInstance.start();

    //     ConfigManager.observe(ServerKey).subscribe((server) => {
    //         this._sharedInstance.stop();
    //         this._sharedInstance.initial({ debug: true, server });
    //         this._sharedInstance.start();
    //     });

    //     return this._sharedInstance;
    // }

    constructor(config: IServerConfig) {
        this.initial(config);
    }

    private snInitial: Subscription;
    initial(config: IServerConfig) {
        this.config = config;
        /// initialize
        CMSServer.initializer.forEach( (init) => init.call(this) );

        if (this.snInitial) {
            this.snInitial.unsubscribe();
            this.snInitial = null;
        }
        this.snInitial = this.sjRequestLogin.subscribe( (reason) => {
            if (this.config.debug) {
                switch (reason) {
                    case RequestLoginReason.SessionExpired:
                        Log.Error(LogTitle, `Session expired. Mostly because of being logout (with account <${this.config.server.account}>).`);
                        break;
                    default:
                        Log.Error(LogTitle, "Request to login again. (Unknown Error)");
                        break;
                }
            }
            this.login();
        });
    }

    start() {
        this.config.debug && Log.Info(LogTitle, "Started.");
        this.sjStarted.next(true);
        this.login();
    }

    stop() {
        this.sjStarted.next(false);
        this.sjLogined.next(false);
        this.sjLoggingIn.next(false);
        this.config.debug && Log.Info(LogTitle, "Stopped.");
        if (this.snInitial) {
            this.snInitial.unsubscribe();
            this.snInitial = null;
        }
    }

    /// private helpers /////////////////////
    private makeUrl(config: IServerCoreConfig, func: string, data?: any, ws?: boolean);
    private makeUrl(func: string, data?: any, ws?: boolean);
    private makeUrl(config: any, func?: any, data?: any, ws?: boolean) {
        if (typeof config === "string") {
            ws = data;
            data = func;
            func = config;
            config = null;
        }
        let { hostname, port, protocol } = config || this.config.server;
        let deepTrace = (prevKey: any, data?: any) => {
            if (!data) {
                data = prevKey;
                prevKey = null;
            }
            let isArray = Array.isArray(data);
            return Object.keys(data).reduce<string[]>((final, key) => {
                let value = data[key];
                if (!(value instanceof Object)) {
                    value = encodeURIComponent(value);
                    if (isArray) final.push(prevKey ? `${prevKey}=${value}` : `${key}=${value}`);
                    else final.push(prevKey ? `${prevKey}.${key}=${value}` : `${key}=${value}`);
                }
                else final.splice(0, 0, ...deepTrace(key, value));
                return final;
            }, []);
        };
        let params = data ? deepTrace(data).join('&') : "";
        ///const urlbase: string = `${ws?"ws":"http"}${ssl?'s':''}://${host}`;
        const urlbase: string = `${ws?(protocol==="https"?"wss":"ws"):protocol}://${hostname}:${port}`;
        return `${urlbase}/${func||""}?${params}`;
    }

    public waitForSubject(target: BehaviorSubject<boolean>): Promise<boolean> {
        return target.getValue() === true ? null :
            target.filter(val => val === true).first().toPromise();
    }
    public waitForLogin() {
        return this.waitForSubject(this.sjLogined);
    }
    
    public testlogin(config: IServerCoreConfig): Promise<boolean | any> {
        const url = this.makeUrl(config, this.loginUri);
        let { hostname, port, account: username, password } = config;

        let promiseTimeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000));
        let promiseRequest = new Promise<boolean>((resolve) => {
            let crypto = new CryptoService();
            username = crypto.encrypt4DB(username);
            password = crypto.encrypt4DB(password);
            request({
                url, method: 'POST', json: true,
                headers: {
                    "Content-Type": "application/json",
                    "X-Parse-Application-Id": "CMS3-Parse-API"
                },
                body: { username, password }
            }, async (err, res, body) => {
                if (err ||
                    (res && res.statusCode !== 200)
                    ) {
                    resolve(false);
                } else {
                    resolve(body);
                }
            });
        });

        return Promise.race([promiseTimeout, promiseRequest]);
    }

    /// private functions ///////////////////
    /// prevent multiple login process
    private sjLoggingIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private maintainTimer: any = null;
    public login() {
        if (this.sjStarted.getValue() === false) return;

        const url = this.makeUrl(this.loginUri);
        if (this.sjLoggingIn.getValue() === true || this.sjStarted.getValue() === false) return;
        this.sjLogined.next(false);
        this.sjLoggingIn.next(true);

        let { hostname, port, account: username, password } = this.config.server;

        request({
            url, method: 'POST', json: true,
            headers: { "content-type": "application/json" },
            body: { username, password }
        }, async (err, res, body) => {
            this.sjLoggingIn.next(false);
            if (err ||
                (res && res.statusCode !== 200)
                ) {
                let started = this.sjStarted.getValue();
                let logined = this.sjLogined.getValue();
                !logined && this.config.debug && Log.Error(LogTitle, `Login failed@${hostname}:${port}. ${started ? "Retry in 1 second." : ""}`);
                if (started && !logined) {
                    this.reconnector.start();
                }
                return;
            }
            this.reconnector.stop();
            this.config.debug && Log.Info(LogTitle, `Login into Server@${hostname}:${port}.`);
            this.sessionId = body.sessionId;

            this.sjLogined.next(true);
        });
    }
}

CMSServer.initializer.push( function() {
    let me = this;
    if (!(this as any).reconnector) {
        (this as any).reconnector = new Reconnector(() => {
            me.login();
        });
    }
});

// import './modules/person-tag';
// // import './modules/vms-person-tag';
// import './modules/person-visitor';