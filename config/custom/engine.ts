import { DBConfig } from "helpers/config/db-config";

/// 3 days
// searchDurationSeconds: 259200, 28800
/// 30 days
// 7776000

var config = DBConfig<Config>({
    // enableStrangerDetection: false,
    // faceSearchDurationMinutes: 60,
    // mergeFaceSeconds: 15,
    // blurFaceMergeScore: 0.6,
    // matchScore: 0.85,
    // associatedFaceCaptureSeconds: 10,
    // notAllowedAreaDurationSeconds: 180,
    // notAllowedAreaDetectionTimes: 2,
    // appPreloadDurationMinutes: 60
});
export default config;

export interface Config {
    // /// detect stranger or not?
    // enableStrangerDetection: boolean;
    // /// timeline search duration
    // faceSearchDurationMinutes: number;
    // /// how long of faces should try merge into one
    // mergeFaceSeconds: number;
    // /// which score of stranger should try merge together
    // blurFaceMergeScore: number;
    // /// where same stranger should be recognized as same person
    // matchScore: number;
    // /// associated person capture in seconds
    // associatedFaceCaptureSeconds: number;

    // /// not allowed area detection
    // notAllowedAreaDurationSeconds: number;
    // notAllowedAreaDetectionTimes: number;

    // /// application startup preload events
    // appPreloadDurationMinutes: number;

    // /// google API token
    // googleAPIToken?: string;
}