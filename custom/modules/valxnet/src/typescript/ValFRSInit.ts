import Lib from "./lib";
import { ELogLevel } from "./core";

let ValFRSInitImpl = Lib.ValFRSInit;

export interface IValFRSInitConfig {
    paths: {
        db: string;
        model: string;
    }
};

export interface ValFRSInit {
    (config: IValFRSInitConfig): void;
};

export var ValFRSInit: ValFRSInit = Lib.ValFRSInit;