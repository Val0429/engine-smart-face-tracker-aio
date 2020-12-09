import Lib from "./lib";
import { ELogLevel, ICallback, ValPromisify } from "./core";

/// encode interface ////////////////////
interface IUtilEncodeBase64Config {
    /// default: undefined. ex: image/png
    setMimeType?: string;
}
interface IUtilEncodeBase64FromPathConfigBase {
    /// default: false
    detectMimeType?: boolean;
}
interface IUtilEncodeBase64NoStringConfig {
    /// default: false
    asString?: false;
}
interface IUtilEncodeBase64AsStringConfig {
    /// default: false
    asString: true;
}
type IUtilEncodeBase64FromPathConfig = IUtilEncodeBase64FromPathConfigBase & IUtilEncodeBase64Config;
type IUtilEncodeBase64FromPathNoStringConfig = IUtilEncodeBase64FromPathConfig & IUtilEncodeBase64NoStringConfig;
type IUtilEncodeBase64FromPathAsStringConfig = IUtilEncodeBase64FromPathConfig & IUtilEncodeBase64AsStringConfig;

type IUtilEncodeBase64FromBufferNoStringConfig = IUtilEncodeBase64Config & IUtilEncodeBase64NoStringConfig;
type IUtilEncodeBase64FromBufferAsStringConfig = IUtilEncodeBase64Config & IUtilEncodeBase64AsStringConfig;

/// decode interface ///////////////////
interface IUtilDecodeBase64GetMimeConfig {
    /// default: false
    getMimeType?: true;
}
interface IUtilDecodeBase64NoMimeConfig {
    /// default: false
    getMimeType?: false;
}

interface IUtilDecodeWithMime {
    /// ex: image/png
    mime: string;
    value: Buffer;
}

export interface ValFRSUtil {
    new (): ValFRSUtil;

    logLevel: ELogLevel;

    /// default encode to Buffer
    encodeBase64(path: string, config?: IUtilEncodeBase64FromPathNoStringConfig): Buffer;
    encodeBase64(path: string, config: IUtilEncodeBase64FromPathAsStringConfig): string;
    encodeBase64(value: Buffer, config?: IUtilEncodeBase64FromBufferNoStringConfig): Buffer;
    encodeBase64(value: Buffer, config: IUtilEncodeBase64FromBufferAsStringConfig): string;
    
    /// accept string or Buffer
    decodeBase64(value: string | Buffer, config?: IUtilDecodeBase64NoMimeConfig): Buffer;
    decodeBase64(value: string | Buffer, config: IUtilDecodeBase64GetMimeConfig): IUtilDecodeWithMime;
}

export var ValFRSUtil: ValFRSUtil = Lib.ValFRSUtil;
