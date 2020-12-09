import {
    Restful, Action
} from "core/cgi-package";
import { ValFaceCapture, ValFaceFeature, ValDisposeAll, ISharedFeature, ISharedCapturedFace, EImageEncodeFormatType, EFaceFeatureSnapshotType } from "workspace/custom/modules/valxnet";
import { IExtractedInfo } from "workspace/custom/models/extracted-info";

import * as path from 'path';
import * as shortid from 'shortid';

var action = new Action({
    loginRequired: false
});

/********************************
 * C: create object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({
    inputType: "InputR"
}, async (data) => {
    return "" as any;
    //return (data.request as any).ntlm as any;
    // return (data.request as any).user as any;
});

export default action;
