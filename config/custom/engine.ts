import { DBConfig } from "helpers/config/db-config";

var config = DBConfig<Config>({
    dataRetensionDays: 60
});
export default config;

export interface Config {
    /// 資料保留時間
    dataRetensionDays?: number;
}