"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgPool = void 0;
const pg_1 = require("pg");
const env_1 = require("../config/env");
exports.pgPool = new pg_1.Pool({
    connectionString: env_1.config.DATABASE_URL,
    max: env_1.config.PG_POOL_MAX,
    idleTimeoutMillis: env_1.config.PG_IDLE_TIMEOUT_MS,
    statement_timeout: env_1.config.PG_STATEMENT_TIMEOUT_MS
});
