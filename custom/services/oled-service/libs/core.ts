import { IConfigSetup } from "core/config.gen";

export const LogTitle = "OLED Server";
export const ServerKey = "oled";
export type IServerCoreConfig = IConfigSetup["oled"];

export interface IServerConfig {
    server: IServerCoreConfig;
    debug?: boolean;
}

export enum RequestLoginReason {
    SessionExpired
}

