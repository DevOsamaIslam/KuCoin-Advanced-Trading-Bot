"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kucoin = void 0;
const kucoin_node_sdk_1 = __importDefault(require("kucoin-node-sdk"));
const settings_1 = require("./settings");
exports.kucoin = kucoin_node_sdk_1.default.init({
    key: settings_1.API_KEY,
    secret: settings_1.API_SECRET,
    passphrase: settings_1.API_PASSPHRASE,
});
