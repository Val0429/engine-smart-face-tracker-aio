
import { Config } from 'config_default/core';

var config: Partial<Config> = {
    port: 6082,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: "api",
    restrictToLocal: true
};
export default config;
export { Config };