"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_PASSPHRASE = exports.API_SECRET = exports.API_KEY = exports.BASE_URL = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.BASE_URL = process.env.BASE_URL || "";
exports.API_KEY = process.env.API_KEY || "";
exports.API_SECRET = process.env.SECRET || "";
exports.API_PASSPHRASE = process.env.PASSPHRASE || "";
