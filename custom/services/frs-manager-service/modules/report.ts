import { Response } from '~express/lib/response';
import { FRSManagerServer } from '../index';
import * as request from 'request';
import { RequestLoginReason, IOutputPerson, LogTitle, IOutputPersonPrehandle } from '../libs/core';
import { Restful } from 'helpers/cgi-helpers/core';

import { Subject, Observable } from 'rxjs';
import { publish, refCount, tap, finalize } from 'rxjs/operators';
import { detectRef } from 'workspace/custom/helpers/detect-ref';
import { SymbolDisconnected, SymbolReconnected, SymbolSessionKickedOut, VWebSocket } from 'workspace/custom/helpers/vwebsocket';
import { Log } from 'helpers/utility';

declare module "../" {
    interface FRSManagerServer {
        sjLivePerson: Subject<IOutputPerson>;
        obLivePerson: Observable<IOutputPerson>;
        // _lp_vsocket: VWebSocket;
        // _lp_refcount: number;
        getLivePerson(): Promise<Observable<IOutputPerson>>;
    }
}

FRSManagerServer.initializer.push( function() {
    let me = this;
    let vsocket: VWebSocket;
    let refcount: number = 0;

    /// init propreties ///
    if (!this.sjLivePerson) {
        const uri = "report/live/person";
        refcount = 0;
        this.sjLivePerson = new Subject<IOutputPerson>();
        const isLogined = () => (this as any).sjLogined.getValue();
        const stop = () => {
            /// stop
            if (vsocket) {
                vsocket.stop();
                vsocket = null;
            }
        }
        const restart = () => {
            // if (!isLogined() || this._refcount === 0) return;
            if (refcount === 0) return;
            /// start
            if (vsocket) vsocket.stop();
            let url = (this as any).makeUrl(uri, { sessionId: (this as any).sessionId }, true);
            vsocket = new VWebSocket("FRSM LivePerson", url, (data) => {
                if (data === SymbolSessionKickedOut) {
                    (this as any).sjRequestLogin.next(RequestLoginReason.SessionExpired);
                } else if (data === SymbolReconnected) {
                    /// this.sjLivePerson.next(data);
                } else if (data === SymbolDisconnected) {
                    ///
                } else {
                    if (!data.faceFeature) {
                        Log.Error(LogTitle, `Missing faceFeature! @${url}`);
                        return;
                    }
                    data = IOutputPersonPrehandle.call(this, data);
                    this.sjLivePerson.next(data);
                }
            }, (connection) => {
                /// on connect enable face feature
                connection.sendUTF(
                    JSON.stringify({
                        type: 'faceFeature',
                        content: true
                    })
                );
            });
        }
        /// subscribe for reconnect
        (this as any).sjStarted.subscribe( (value) => {
            if (value) {
                restart();
            } else {
                stop();
            }
        });

        this.obLivePerson = this.sjLivePerson
            .pipe(publish(), refCount(), detectRef(async (refCount) => {
                refcount = refCount;
                if (refCount === 1) {
                    restart();
                } else if (refCount === 0) {
                    stop();
                }
            })) as any;
    }
});

FRSManagerServer.prototype.getLivePerson = async function() {
    await this.waitForLogin();
    return this.obLivePerson;
}
