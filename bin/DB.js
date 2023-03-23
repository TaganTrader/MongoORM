"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectId = void 0;
const mongodb_1 = require("mongodb");
var mongodb_2 = require("mongodb");
Object.defineProperty(exports, "ObjectId", { enumerable: true, get: function () { return mongodb_2.ObjectId; } });
exports.default = new class DB {
    connections;
    dbs;
    constructor() {
        this.connections = {};
        this.dbs = {};
    }
    async createDBConnection(config) {
        if (config.type == "MongoDB") {
            this.connections[config.name] = await mongodb_1.MongoClient.connect(config.connectionString);
            this.dbs[config.name] = this.connections[config.name].db(config.db_name);
        }
    }
};
