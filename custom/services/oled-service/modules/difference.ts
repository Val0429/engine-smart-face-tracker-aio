import { Response } from '~express/lib/response';
import { OledServer } from '../index';
import * as request from 'request';
import { RequestLoginReason } from '../libs/core';
import { Restful } from 'helpers/cgi-helpers/core';

import { IBuilding, IFloor, ICompany, IFloorMap, ICMS, IFRSM, ICMSDevice, IFRSMDevice } from "./core";

import { Subject, Observable } from 'rxjs';
import { publish, refCount, tap, finalize } from 'rxjs/operators';
import { detectRef } from 'workspace/custom/helpers/detect-ref';
import { SymbolDisconnected, SymbolReconnected, SymbolSessionKickedOut, VWebSocket } from 'workspace/custom/helpers/vwebsocket';

// (async () => {
//     let sj = new Subject();
//     // let ob = sj.asObservable()
//     let ob = sj
//         .pipe(publish(), refCount(), detectRef((refCount) => {
//             console.log("ref??", refCount);
//         }));

//     let sup1 = ob.subscribe( (value) => {
//         console.log("hey", value);
//     });
//     let sup2 = ob.subscribe( () => {});
//     sj.next("Val");
//     sj.next("Tina");
//     sup1.unsubscribe();
//     sup2.unsubscribe();

//     ob.subscribe();

// })();

export interface IDifference_Base {
    type: 'c' | 'u' | 'd';
}
export interface IDifference_Building extends IDifference_Base {
    topic: 'building';
    content: IBuilding;
}
export interface IDifference_Floor extends IDifference_Base {
    topic: 'floor';
    content: IFloor;
}
export interface IDifference_Company extends IDifference_Base {
    topic: 'company';
    content: ICompany;
}
export interface IDifference_FloorMap extends IDifference_Base {
    topic: 'floor-map';
    content: IFloorMap;
}
export interface IDifference_CMS extends IDifference_Base {
    topic: 'cms';
    content: ICMS;
}
export interface IDifference_CMSDevice extends IDifference_Base {
    topic: 'cms-device';
    content: ICMSDevice;
}
export interface IDifference_FRSManager extends IDifference_Base {
    topic: 'frsm';
    content: IFRSM;
}
export interface IDifference_FRSMDevice extends IDifference_Base {
    topic: 'frsm-device';
    content: IFRSMDevice;
}

export type IDifference = IDifference_Building | IDifference_Floor | IDifference_Company | IDifference_FloorMap | IDifference_CMS | IDifference_FRSManager | IDifference_CMSDevice | IDifference_FRSMDevice | Symbol;

declare module "../" {
    interface OledServer {
        sjDifference: Subject<IDifference>;
        obDifference: Observable<IDifference>;
        _vsocket: VWebSocket;
        _refcount: number;
        getDifferences(): Observable<IDifference>;
    }
}

OledServer.initializer.push( function() {
    let me = this;
    /// init propreties ///
    if (!this.sjDifference) {
        const uri = "notify/difference";
        this._refcount = 0;
        this.sjDifference = new Subject<IDifference>();
        const isLogined = () => (this as any).sjLogined.getValue();
        const stop = () => {
            /// stop
            if (this._vsocket) {
                this._vsocket.stop();
                this._vsocket = null;
            }
        }
        const restart = () => {
            // if (!isLogined() || this._refcount === 0) return;
            if (this._refcount === 0) return;
            /// start
            if (this._vsocket) this._vsocket.stop();
            let url = (this as any).makeUrl(uri, { sessionId: (this as any).sessionId }, true);
            this._vsocket = new VWebSocket("OLED Diff", url, (data) => {
                if (data === SymbolSessionKickedOut) {
                    (this as any).sjRequestLogin.next(RequestLoginReason.SessionExpired);
                } else if (data === SymbolReconnected) {
                    this.sjDifference.next(data);
                } else if (data === SymbolDisconnected) {
                    ///
                } else {
                    this.sjDifference.next(data);
                }
            });
        }
        /// subscribe for reconnect
        (this as any).sjStarted.subscribe( (value) => {
            if (value) {
                restart();
            }
        });

        this.obDifference = this.sjDifference
            .pipe(publish(), refCount(), detectRef(async (refCount) => {
                this._refcount = refCount;
                if (refCount === 1) {
                    restart();
                } else if (refCount === 0) {
                    stop();
                }
            })) as any;
    }
});

OledServer.prototype.getDifferences = function() {
    return this.obDifference;
}
