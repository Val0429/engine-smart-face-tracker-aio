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

interface IInputFeature {
    image: string;
    /// default: 0.99
    fcConfidenceScore?: number;
    /// default: 30. at most N faces capture per frame
    fcMaxCaptureFaces?: number;
    /// default: 0. face w & h should be larger than N (px).
    fcMinFaceLength?: number;
    /// default: 60. face pitch should be less than N (degree).
    fcMaxPitchAngle?: number;
    /// default: 30. face yaw should be less than N (degree).
    fcMaxYawAngle?: number;
}

interface IOutputFeature {
    objects: IExtractedInfo[];
}

/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IInputFeature>;
type OutputC = Restful.OutputC<IOutputFeature>;

const snapshotPath = path.resolve(__dirname, "../../custom/assets/snapshots");

let fc: ValFaceCapture;
let ff: ValFaceFeature;
action.post<InputC, OutputC>({ inputType: "InputC", postSizeLimit: 1024*1024*10 }, async (data) => {
    if (!fc) fc = new ValFaceCapture();
    if (!ff) ff = new ValFaceFeature();

    let inputType = data.inputType;
    let { image } = inputType;
    let regex = /^data:([^;]+);base64,/i;
    image = image.replace(regex, "");
    let buffer = Buffer.from(image, "base64");

    let detects: ISharedCapturedFace[];
    let objects: IExtractedInfo[] = [];
    try {
        detects = await fc.detect(buffer, {
            confidenceScore: inputType.fcConfidenceScore,
            maxCaptureFaces: inputType.fcMaxCaptureFaces,
            maxPitchAngle: inputType.fcMaxPitchAngle,
            maxYawAngle: inputType.fcMaxYawAngle,
            minFaceLength: inputType.fcMinFaceLength
        });

        let features: ISharedFeature[];
        
        try {
            features = await ff.extract(detects);
            for (let i=0; i<features.length; ++i) {
                let featureObject = features[i];
                let imageUri = await featureObject.saveFile({ path: snapshotPath, postfix: shortid.generate(), encodeType: EImageEncodeFormatType.jpg, snapshotType: EFaceFeatureSnapshotType.image });
                imageUri = path.basename(imageUri);

                let feature = await featureObject.getBuffer({ snapshotType: EFaceFeatureSnapshotType.feature, base64: true });
                let imageRect = featureObject.getSize({ snapshotType: EFaceFeatureSnapshotType.image });
                let faceRect = featureObject.getSize({ snapshotType: EFaceFeatureSnapshotType.face });
                let confidenceScore = toFixedNumber(featureObject.score, 3);
                let pitch = toFixedNumber(featureObject.pitch, 3);
                let yaw = toFixedNumber(featureObject.yaw, 3);
                
                // make ICameraLive
                let o: IExtractedInfo = {
                    imageUri,
                    feature,
                    imageRect,
                    faceRect,
                    confidenceScore,
                    pitch,
                    yaw
                }
                objects.push(o);
            }
        }
        finally { ValDisposeAll(features) }

    }
    finally { ValDisposeAll(detects) }

    return {
        objects
    } as any;
});

export default action;

function toFixedNumber(num, digits, base = 10){
    var pow = Math.pow(base, digits);
    return Math.round(num*pow) / pow;
}