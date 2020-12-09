import { client, connection } from "websocket";
import { Log } from "helpers/utility";

export const SymbolDisconnected = Symbol("Disconnected");
export const SymbolReconnected = Symbol("Reconnected");
export const SymbolSessionKickedOut = Symbol("SessionKickedOut");

export class VWebSocket {
    private logTitle: string;
    private url: string;
    private callback: (data: any) => void;
    private connectCallback: (connection: connection) => void;
    private cli: client;
    private connection;
    private stopped: boolean = false;
    constructor(logTitle: string, url: string, callback: (data: any) => void, onConnectCallback?: (connection: connection) => void) {
        this.logTitle = logTitle;
        this.url = url;
        this.callback = callback;
        this.connectCallback = onConnectCallback;
        this.connect();
    }

    private waitForMilliSeconds(milliSeconds: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            setTimeout(resolve, milliSeconds);
        });
    }

    private connect() {
        let cli = this.cli = new client();
        let reconnect = async () => {
            if (this.stopped) return;
            await this.waitForMilliSeconds(1000);
            this.connect();
        }
        cli.on('connect', (connection: connection) => {
            let firstConnected = true;
            this.connection = connection;
            Log.Info(this.logTitle, `Websocket Connected.`);
            !this.stopped && this.callback(SymbolReconnected);
            connection.on('error', (err) => {
                Log.Error(this.logTitle, `Websocket Connection Error. ${JSON.stringify(err)}`);
                !this.stopped && this.callback(SymbolDisconnected);
                reconnect();
            });
            connection.on('close', () => {
                Log.Error(this.logTitle, `Websocket Connection Closed.`);
                !this.stopped && this.callback(SymbolDisconnected);
                // reconnect();
            });
            connection.on('message', (message) => {
                var data = eval(`(${message.utf8Data})`);
                let code = (<any>data).statusCode;
                if (code) {
                    if (code === 200) {
                        if (firstConnected) {
                            this.connectCallback && this.connectCallback(connection);
                            // this.connectCallback && setTimeout(() => this.connectCallback(connection), 1000);
                            firstConnected = false;
                        }
                        return;
                    }
                    if (code === 401 || code === 423) {
                        Log.Error(this.logTitle, `Websocket Session problem. (high possibility been kicked out)`);
                        !this.stopped && this.callback(SymbolSessionKickedOut);
                        return;
                    }
                    Log.Error(this.logTitle, `Live Faces Websocket Other Error, data: ${JSON.stringify(data)}`);
                    return;
                }
                this.callback(data);
            });
            // this.connectCallback && setTimeout(() => this.connectCallback(connection), 100);
            // this.connectCallback && process.nextTick(() => this.connectCallback(connection));
        });

        cli.on('connectFailed', (err) => {
            Log.Error(this.logTitle, `Websocket Connect Failed. ${JSON.stringify(err)}`);
            reconnect();
        });
        !this.stopped && cli.connect(this.url, 'echo-protocol');
    }

    stop() {
        this.stopped = true;
        this.connection && this.connection.close();
        this.cli = null;
        this.connection = null;
    }
}
