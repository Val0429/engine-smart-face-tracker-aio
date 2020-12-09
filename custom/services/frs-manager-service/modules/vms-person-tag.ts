import { Response } from '~express/lib/response';
import { FRSManagerServer } from '../index';
import * as request from 'request';
import { RequestLoginReason } from '../libs/core';
import { Restful } from 'helpers/cgi-helpers/core';

import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { publish, refCount, tap, finalize } from 'rxjs/operators';
import { IPersonTag } from './core';

declare module "../" {
    interface FRSManagerServer {
        sjVMSTag: BehaviorSubject<string>;
    }
}

FRSManagerServer.initializer.push( function() {
    let me = this;
    const VMSVisitorTag: string = "FET_Visitor";

    if (!this.sjVMSTag) this.sjVMSTag = new BehaviorSubject<string>(null);

    (this as any).sjLogined.subscribe( async (value) => {
        if (value && !this.sjVMSTag.getValue()) {
            let tag: IPersonTag;
            let tags = await this.getPersonTags({ keyword: VMSVisitorTag });
            if (tags.results.length === 0) {
                /// create one
                tag = await this.createPersonTag(VMSVisitorTag);
            } else {
                tag = tags.results[0];
            }

            // /// todo remove
            // let tags = await this.getPersonTags({ objectId: "qD5x08EWRA" });
            // tag = tags.results[0];

            this.sjVMSTag.next(tag.objectId);
        }
    });

});
