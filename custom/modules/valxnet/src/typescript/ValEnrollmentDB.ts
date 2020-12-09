import Lib from "./lib";
import { ELogLevel, IInputPagingBase, IOutputPagingBase, ISharedFeature, ICallback, ValPromisify } from "./core";

/// Enrollment

/// Group //////////////////
interface IGroup {
    objectId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

/// C //////////////////////
interface IInputGroupAdd {
    name: string;
};
type IOutputGroupAdd = IGroup;

/// R //////////////////////
interface IInputGroupList {
    paging?: IInputPagingBase;
};
interface IOutputGroupList {
    paging?: IInputPagingBase & IOutputPagingBase;
    results: IGroup[];
};

/// U //////////////////////
interface IInputGroupEdit {
    objectId: string;
    name?: string;
};
type IOutputGroupEdit = IGroup;

/// D //////////////////////
interface IInputGroupDelete {
    objectId: string;
};
type IOutputGroupDelete = undefined;


/// Person //////////////////
type Uri = string;
type Group = string;
interface IPerson {
    objectId: string;
    name: string;
    images: Uri[];
    groups: IGroup[];
    createdAt: Date;
    updatedAt: Date;
}

/// C //////////////////////
interface IInputPersonAdd {
    name: string;
    images: Buffer[];
    groups: Group[];
};
type IOutputPersonAdd = IPerson;

/// R //////////////////////
interface IInputPersonList {
    paging?: IInputPagingBase;
    objectId?: string;
};
interface IOutputPersonList {
    paging?: IInputPagingBase & IOutputPagingBase;
    results: IPerson[];
};

/// U //////////////////////
interface IInputPersonEdit {
    objectId: string;
    name?: string;
    images?: Buffer[];
    groups?: string[];
};
type IOutputPersonEdit = IPerson;

/// D //////////////////////
interface IInputPersonDelete {
    objectId: string;
};
type IOutputPersonDelete = undefined;

/// Match
interface IInputMatchConfig {
    maxMatchs?: number;
    groups?: string[];
};
interface IOutputMatchUnit {
    score: number;
    person: IPerson;
};

interface IOutputMatch {
    matches: IOutputMatchUnit[];
};

type IOutputMatches = IOutputMatch[];

// type IOutputMatches = IOutputMatchUnit[];

export type IValEnrollmentDBMatchTarget = ISharedFeature | Buffer;

/// Main
export interface ValEnrollmentDB {
    new (): ValEnrollmentDB;

    groupAddWithCallback(value: IInputGroupAdd, callback: ICallback<IOutputGroupAdd>): void;
    groupAdd(value: IInputGroupAdd): Promise<IOutputGroupAdd>;
    groupListWithCallback(value: IInputGroupList, callback: ICallback<IOutputGroupList>): void;
    groupList(value: IInputGroupList): Promise<IOutputGroupList>;
    groupEditWithCallback(value: IInputGroupEdit, callback: ICallback<IOutputGroupEdit>): void;
    groupEdit(value: IInputGroupEdit): Promise<IOutputGroupEdit>;
    groupDeleteWithCallback(value: IInputGroupDelete, callback: ICallback<IOutputGroupDelete>): void;
    groupDelete(value: IInputGroupDelete): Promise<IOutputGroupDelete>;

    personAddWithCallback(value: IInputPersonAdd, callback: ICallback<IOutputPersonAdd>): void;
    personAdd(value: IInputPersonAdd): Promise<IOutputPersonAdd>;
    personListWithCallback(value: IInputPersonList, callback: ICallback<IOutputPersonList>): void;
    personList(value: IInputPersonList): Promise<IOutputPersonList>;
    personEditWithCallback(value: IInputPersonEdit, callback: ICallback<IOutputPersonEdit>): void;
    personEdit(value: IInputPersonEdit): Promise<IOutputPersonEdit>;
    personDeleteWithCallback(value: IInputPersonDelete, callback: ICallback<IOutputPersonDelete>): void;
    personDelete(value: IInputPersonDelete): Promise<IOutputPersonDelete>;

    matchWithCallback(input: IValEnrollmentDBMatchTarget, callback: ICallback<IOutputMatch>): void;
    matchWithCallback(input: IValEnrollmentDBMatchTarget[], callback: ICallback<IOutputMatch[]>): void;
    matchWithCallback(input: IValEnrollmentDBMatchTarget, config: IInputMatchConfig, callback: ICallback<IOutputMatch>): void;
    matchWithCallback(input: IValEnrollmentDBMatchTarget[], config: IInputMatchConfig, callback: ICallback<IOutputMatch[]>): void;
    match(input: IValEnrollmentDBMatchTarget): Promise<IOutputMatch>;
    match(input: IValEnrollmentDBMatchTarget[]): Promise<IOutputMatch[]>;
    match(input: IValEnrollmentDBMatchTarget, config: IInputMatchConfig): Promise<IOutputMatch>;
    match(input: IValEnrollmentDBMatchTarget[], config: IInputMatchConfig): Promise<IOutputMatch[]>;

    logLevel: ELogLevel;
};

Lib.ValEnrollmentDB.prototype.groupAdd = ValPromisify(Lib.ValEnrollmentDB.prototype.groupAddWithCallback);
Lib.ValEnrollmentDB.prototype.groupList = ValPromisify(Lib.ValEnrollmentDB.prototype.groupListWithCallback);
Lib.ValEnrollmentDB.prototype.groupEdit = ValPromisify(Lib.ValEnrollmentDB.prototype.groupEditWithCallback);
Lib.ValEnrollmentDB.prototype.groupDelete = ValPromisify(Lib.ValEnrollmentDB.prototype.groupDeleteWithCallback);

Lib.ValEnrollmentDB.prototype.personAdd = ValPromisify(Lib.ValEnrollmentDB.prototype.personAddWithCallback);
Lib.ValEnrollmentDB.prototype.personList = ValPromisify(Lib.ValEnrollmentDB.prototype.personListWithCallback);
Lib.ValEnrollmentDB.prototype.personEdit = ValPromisify(Lib.ValEnrollmentDB.prototype.personEditWithCallback);
Lib.ValEnrollmentDB.prototype.personDelete = ValPromisify(Lib.ValEnrollmentDB.prototype.personDeleteWithCallback);

Lib.ValEnrollmentDB.prototype.match = ValPromisify(Lib.ValEnrollmentDB.prototype.matchWithCallback);

/// export
export var ValEnrollmentDB: ValEnrollmentDB = Lib.ValEnrollmentDB;
