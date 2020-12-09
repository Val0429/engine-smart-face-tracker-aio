import { IConfigSetup } from "core/config.gen";

export const LogTitle = "CMS Server";
export const ServerKey = "cms";
// export type IServerCoreConfig = IConfigSetup["frsmanager"];
export interface IServerCoreConfig {
    hostname: string;
    port: number;
    account: string;
    password: string;
    protocol: string;
}

export interface IServerConfig {
    server: IServerCoreConfig;
    debug?: boolean;
}

export enum RequestLoginReason {
    SessionExpired
}

