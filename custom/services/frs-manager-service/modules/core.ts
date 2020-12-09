import { Restful } from 'helpers/cgi-helpers/core';

export interface IPersonTag {
    objectId: string;
    name: string;
    isUserDefined: boolean;
}

export interface IPersonVisitor {
    objectId: string;
    card: string;
}

export type IOutputPersonTag = Restful.OutputR<IPersonTag, { parseObject: false }>;

export type IOutputPersonVisitor = Restful.OutputR<IPersonVisitor, { parseObject: false }>;