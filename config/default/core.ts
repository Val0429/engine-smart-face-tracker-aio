
import { Config } from 'config_default/core';

var config: Partial<Config> = {
    port: 6070,
    disableCache: true,
    accessControlAllowOrigin: true,
    cgiPath: ""
};
export default config;
export { Config };