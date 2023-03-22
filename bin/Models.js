"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = exports.generateTableName = exports.deepDiffMapperUpdated = void 0;
const DB_1 = __importDefault(require("./DB"));
const Plural_1 = __importDefault(require("./Plural"));
const sortObject = (o) => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
exports.deepDiffMapperUpdated = function () {
    return {
        VALUE_CREATED: 'created',
        VALUE_UPDATED: 'updated',
        VALUE_DELETED: 'deleted',
        VALUE_UNCHANGED: '---',
        map: function (obj1, obj2) {
            if (this.isFunction(obj1) || this.isFunction(obj2)) {
                throw 'Invalid argument. Function given, object expected.';
            }
            if (this.isValue(obj1) || this.isValue(obj2)) {
                let returnObj = {
                    type: this.compareValues(obj1, obj2),
                    original: obj1,
                    updated: obj2,
                };
                if (returnObj.type != this.VALUE_UNCHANGED) {
                    if (returnObj.type === this.VALUE_DELETED) {
                        return { $unset: true };
                    }
                    else
                        return returnObj.updated;
                }
                return undefined;
            }
            let diff = {};
            let foundKeys = {};
            for (let key in obj1) {
                if (this.isFunction(obj1[key])) {
                    continue;
                }
                let value2 = undefined;
                if (obj2[key] !== undefined) {
                    value2 = obj2[key];
                }
                let mapValue = this.map(obj1[key], value2);
                foundKeys[key] = true;
                if (mapValue !== undefined) {
                    diff[key] = mapValue;
                }
            }
            for (let key in obj2) {
                if (this.isFunction(obj2[key]) || foundKeys[key] !== undefined) {
                    continue;
                }
                let mapValue = this.map(undefined, obj2[key]);
                if (mapValue !== undefined) {
                    diff[key] = mapValue;
                }
            }
            if (Object.keys(diff).length > 0) {
                return diff;
            }
            return undefined;
        },
        compareValues: function (value1, value2) {
            if (value1 === value2) {
                return this.VALUE_UNCHANGED;
            }
            if (this.isDate(value1) && this.isDate(value2) && value1.getTime() === value2.getTime()) {
                return this.VALUE_UNCHANGED;
            }
            if (value1 === undefined) {
                return this.VALUE_CREATED;
            }
            if (value2 === undefined) {
                return this.VALUE_DELETED;
            }
            return this.VALUE_UPDATED;
        },
        isFunction: function (x) {
            return Object.prototype.toString.call(x) === '[object Function]';
        },
        isArray: function (x) {
            return Object.prototype.toString.call(x) === '[object Array]';
        },
        isDate: function (x) {
            return Object.prototype.toString.call(x) === '[object Date]';
        },
        isObject: function (x) {
            return Object.prototype.toString.call(x) === '[object Object]';
        },
        isValue: function (x) {
            return !this.isObject(x) && !this.isArray(x);
        }
    };
}();
function generateTableName(className) {
    const result = Plural_1.default(className.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase());
    return result;
}
exports.generateTableName = generateTableName;
const v8 = require('v8');
const structuredClone = (obj) => {
    return v8.deserialize(v8.serialize(obj));
};
function clone(obj) {
    return Object.assign({}, obj);
}
const modelHandler = {
    get: function (target, prop, recv) {
        if (!target.$private.reflected[prop]) {
            target.$private.reflected[prop] = true;
            var targetValue = Reflect.get(target, prop, recv);
            delete target.$private.reflected[prop];
        }
        if (typeof targetValue === 'function') {
            return function (...args) {
                return targetValue.apply(this, args);
            };
        }
        else {
            if (typeof targetValue === "undefined") {
                if (typeof target.$private.updated[prop] !== "undefined") {
                    return target.$private.updated[prop];
                }
            }
            if (!prop.startsWith('$') && target.hasOwnProperty(prop) && (typeof target.$private.updated[prop] !== "undefined" || typeof target.$private.updated[target.$primaryKey] !== "undefined")) {
                return target.$private.updated[prop];
            }
            return targetValue;
        }
    },
    set: function (target, prop, value, recv) {
        const has = Reflect.has(target, prop);
        if (has) {
            let res = false;
            if (!target.$private.reflected[prop]) {
                target.$private.reflected[prop] = true;
                res = Reflect.set(target, prop, value, recv);
                delete target.$private.reflected[prop];
            }
            if (res)
                return true;
        }
        target.$private.changes[prop] = value;
        if (typeof value === "undefined") {
            console.warn("MongoModels: unsetted value in DB can not deleted. Will be setted empty string");
        }
        target.$private.updated[prop] = value;
        return true;
    },
    deleteProperty(target, prop) {
        if (prop.startsWith('$')) {
            throw new Error("Отказано в доступе");
        }
        else {
            if (target.hasOwnProperty(prop))
                delete target[prop];
            delete target.$private.updated[prop];
            return true;
        }
    },
    getOwnPropertyDescriptor(target, prop) {
        return {
            enumerable: true,
            configurable: true,
        };
    },
    ownKeys(target) {
        if (typeof target.$private.updated[target.$primaryKey] !== "undefined")
            return Object.keys(target.$private.updated).filter(key => target.$guarded.indexOf(key) === -1);
        else {
            const properties = Object.getOwnPropertyNames(target).filter(key => !key.startsWith('$'));
            return [...new Set([
                    ...properties,
                    ...Object.keys(target.$private.updated).filter(key => target.$guarded.indexOf(key) === -1)
                ])];
        }
    }
};
class Model {
    $private = { changes: {}, original: {}, updated: {}, reflected: {} };
    $db = "";
    $table = "";
    $primaryKey = "_id";
    $guarded = ["password"];
    constructor(fills) {
        if (!this.$table)
            this.$table = generateTableName(this.constructor.name);
        if (fills) {
            this.$private.original = clone(fills);
            this.$private.updated = clone(fills);
        }
        return new Proxy(this, modelHandler);
    }
    changes() {
        return exports.deepDiffMapperUpdated.map(this.$private.original, this.$private.updated);
    }
    changesToMongoChanges(changes, setted, unsetted, root) {
        for (let key in changes) {
            if (Object.prototype.toString.call(changes[key]) === '[object Object]') {
                if (changes[key].$unset)
                    unsetted[root + (root !== '' ? '.' : '') + key] = true;
                else
                    this.changesToMongoChanges(changes[key], setted, unsetted, root + (root !== '' ? '.' : '') + key);
            }
            else {
                setted[root + (root !== '' ? '.' : '') + key] = changes[key];
            }
        }
    }
    async save(needInsert = false, bigUpdate = false, sortProperties = false) {
        if (typeof this.beforeSave === "function")
            this.beforeSave();
        const db = DB_1.default.dbs[this.$db];
        let changes = this.changes() || {};
        if (typeof this[this.$primaryKey] === "undefined") {
            Object.getOwnPropertyNames(this).map((prop) => {
                if (!changes.hasOwnProperty(prop) && typeof this[prop] !== "undefined" && !prop.startsWith('$')) {
                    changes[prop] = this[prop];
                }
            });
        }
        if ((Object.keys(changes).length == 0) && typeof this[this.$primaryKey] !== "undefined")
            return;
        if (!db)
            throw new Error('No db seleceted');
        if (sortProperties)
            changes = sortObject(changes);
        if (!needInsert && typeof this.$private.updated[this.$primaryKey] !== "undefined") {
            let setted = {}, unsetted = {};
            if (!bigUpdate)
                this.changesToMongoChanges(changes, setted, unsetted, '');
            else {
                for (let prop in changes) {
                    if (changes[prop].$unset) {
                        unsetted[prop] = true;
                        delete changes[prop];
                    }
                    else {
                        setted[prop] = this.$private.updated[prop];
                    }
                }
            }
            let setUnset = {};
            if (Object.keys(setted).length > 0) {
                setUnset.$set = setted;
            }
            if (Object.keys(unsetted).length > 0) {
                setUnset.$unset = unsetted;
            }
            await db.collection(this.$table).updateOne({
                [this.$primaryKey]: this.$private.updated[this.$primaryKey]
            }, setUnset, { upsert: true, ignoreUndefined: false });
        }
        else {
            await db.collection(this.$table).insertOne(changes);
            Object.assign(this.$private.updated, changes);
        }
        if (changes[this.$primaryKey]) {
            this.$private.updated[this.$primaryKey] = changes[this.$primaryKey];
        }
        this.$private.original = JSON.parse(JSON.stringify(this.$private.updated));
    }
    async delete() {
        const db = DB_1.default.dbs[this.$db];
        if (!db)
            throw new Error('No db seleceted');
        return await db.collection(this.$table).updateOne({
            [this.$primaryKey]: this.$private.updated[this.$primaryKey]
                ? this.$private.updated[this.$primaryKey]
                : false
        }, { $set: { '__deletedAt': new Date().getTime() } });
    }
    serialize() {
        if (typeof this[this.$primaryKey] !== "undefined")
            return Object.fromEntries(Object.entries(this.$private.updated).filter(([key]) => this.$guarded.indexOf(key) === -1));
        else
            return Object.fromEntries(Object.entries(this).filter(([key, value]) => this.$guarded.indexOf(key) === -1 && typeof value !== "undefined"));
    }
    static async findMany(filter, options, returnMongo) {
        const $d = new this();
        const db = DB_1.default.dbs[$d.$db];
        if (!db)
            throw new Error('Model: no db selected');
        if (returnMongo === true) {
            return db.collection($d.$table).find(filter ? filter : {}, options);
        }
        else {
            const dbRes = await db.collection($d.$table).find(filter ? filter : {}, options).toArray();
            const res = [];
            for (let i = 0; i < dbRes.length; i++) {
                res.push(new this(dbRes[i]));
            }
            return res;
        }
    }
    static async findOrFail(filterOrKey) {
        const $d = new this();
        const db = DB_1.default.dbs[$d.$db];
        if (!db)
            throw new Error('Model: no db selected');
        const data = await db.collection($d.$table).findOne(filterOrKey.constructor.name == 'ObjectId' ? { [$d.$primaryKey]: filterOrKey } : filterOrKey);
        if (!data) {
            throw new Error('db no found record');
        }
        let model = new this(data);
        return model;
    }
    static async find(filterOrKey) {
        const $d = new this();
        const db = DB_1.default.dbs[$d.$db];
        if (!db)
            throw new Error('Model: no db selected');
        const data = await db.collection($d.$table).findOne(filterOrKey.constructor.name == 'ObjectId' ? { [$d.$primaryKey]: filterOrKey } : filterOrKey);
        if (!data) {
            return undefined;
        }
        let model = new this(data);
        return model;
    }
}
exports.Model = Model;
