
import { Config } from 'config_default/parse-server';

var config: Partial<Config> = {
    appId: "APPLICATIONKEY",
    masterKey: "MASTERKEY",
    fileKey: "FILEKEY",
    serverPath: "/parse"
};
export default config;
export { Config };