import { DBConfig } from "helpers/config/db-config";
import { Config } from 'config_default/smtp';
export { Config };

var config = DBConfig<Partial<Config>>({});
export default config;
