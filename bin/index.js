"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = exports.DB = void 0;
const DB_1 = __importDefault(require("./DB"));
exports.DB = DB_1.default;
const Models_1 = require("./Models");
Object.defineProperty(exports, "Model", { enumerable: true, get: function () { return Models_1.Model; } });
