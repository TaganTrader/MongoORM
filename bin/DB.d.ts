import { MongoClient, Db } from "mongodb";
export { ObjectId } from "mongodb";
declare type DBType = "MongoDB" | "MySQL";
declare type Config = {
    name: string;
    db_name: string;
    type: DBType;
    connectionString: string;
};
declare const _default: {
    connections: {
        [name: string]: MongoClient;
    };
    dbs: {
        [name: string]: Db;
    };
    createDBConnection(config: Config): Promise<void>;
};
export default _default;
