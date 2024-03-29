import { Filter, FindCursor, FindOptions, ObjectId, Document } from "mongodb";
export declare const deepDiffMapperUpdated: {
    VALUE_CREATED: string;
    VALUE_UPDATED: string;
    VALUE_DELETED: string;
    VALUE_UNCHANGED: string;
    map: (obj1: any, obj2: any) => any;
    compareValues: (value1: any, value2: any) => string;
    isFunction: (x: any) => boolean;
    isArray: (x: any) => boolean;
    isDate: (x: any) => boolean;
    isObject: (x: any) => boolean;
    isValue: (x: any) => boolean;
};
export declare function generateTableName(className: string): string;
declare type Constructor<T> = {
    new (fills?: any): T;
};
export declare class Model {
    protected $private: any;
    protected $db: string;
    protected $table: string;
    protected $primaryKey: string;
    protected $guarded: string[];
    constructor(fills?: any);
    changes(): any;
    private changesToMongoChanges;
    save(needInsert?: boolean, bigUpdate?: boolean, sortProperties?: boolean): Promise<void>;
    delete(): Promise<import("mongodb").UpdateResult>;
    serialize(): any;
    static findMany<T extends Model>(this: Constructor<T>, filter?: Filter<T>, options?: FindOptions<Document>): Promise<T[]>;
    static findMany<T extends Model>(this: Constructor<T>, filter?: Filter<T>, options?: FindOptions<Document>, returnMongo?: boolean): Promise<FindCursor<T>>;
    static findOrFail<T extends Model>(this: Constructor<T>, filterOrKey: object | ObjectId): Promise<T>;
    static find<T extends Model>(this: Constructor<T>, filterOrKey: object | ObjectId): Promise<T | undefined>;
}
export {};
