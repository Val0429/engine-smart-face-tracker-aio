const isWindows = process.platform === "win32";
const version = +process.version.match(/^v([0-9]+)/)[1];

const ffc = isWindows ?
    (
        version >= 8 ? require('./face-feature-compare-v8/featureCompareWin/build/Release/faceFeatureCompare')
                     : require('./face-feature-compare-v6/featureCompareWin/build/Release/faceFeatureCompare')()
    ) :
    (
        version >= 8 ? require('./face-feature-compare-v8/featureCompareLinux-Val/build/Release/faceFeatureCompare')
                     : require('./face-feature-compare-v6/featureCompareLinux/build/Release/faceFeatureCompare')()
    );

    export namespace FaceFeatureCompare {
    function getScore(result): number {
        return typeof result === 'number' ? result : +JSON.parse(result).score;
    }

    export function sync(buffer1, buffer2) {
        var result = ffc.faceFeatureCompare( buffer1, buffer2 );
        return getScore(result);
    }

    export function async(buffer1, buffer2) {
        return new Promise<number>( (resolve) => {
            ffc.faceFeatureCompareAsync( buffer1, buffer2, (score) => {
                //setImmediate(() => resolve(score));
                resolve(getScore(score));
            });
        });
    }

    export function asyncCallback(buffer1, buffer2, callback) {
        ffc.faceFeatureCompareAsync( buffer1, buffer2, (score) => {
            //setImmediate(() => callback(score));
            callback(getScore(score));
        });
    }
}
