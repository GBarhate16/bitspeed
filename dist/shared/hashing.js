"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashKeyToBigInt = hashKeyToBigInt;
exports.hashKeyToInt32Pair = hashKeyToInt32Pair;
const crypto_1 = __importDefault(require("crypto"));
function hashKeyToBigInt(key) {
    const digest = crypto_1.default.createHash('sha256').update(key).digest();
    let num = BigInt(0);
    for (let i = 0; i < 8; i++) {
        num = (num << BigInt(8)) + BigInt(digest[i]);
    }
    // Map to signed 64-bit range for Postgres BIGINT
    return BigInt.asIntN(64, num);
}
function hashKeyToInt32Pair(key) {
    const big = hashKeyToBigInt(key);
    // Extract high and low 32-bit signed integers
    const lowBig = BigInt.asIntN(32, big);
    const highBig = BigInt.asIntN(32, big >> BigInt(32));
    // Convert to JS numbers (within 32-bit signed range)
    const low = Number(lowBig);
    const high = Number(highBig);
    return { high, low };
}
