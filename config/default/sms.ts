import { DBConfig } from "helpers/config/db-config";
import { Config } from 'config_default/sms';
export { Config };

var config = DBConfig<Partial<Config>>({});
export default config;
