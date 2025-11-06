"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const fastify_sensible_1 = __importDefault(require("fastify-sensible"));
const pg_1 = require("./db/pg");
const redis_1 = require("./db/redis");
function buildApp() {
    const app = (0, fastify_1.default)({ logger: true });
    app.register(fastify_sensible_1.default);
    app.get('/health', async (_request, reply) => {
        const status = {
            ok: true,
            pg: { ok: true, error: undefined },
            redis: { ok: true, error: undefined }
        };
        // Postgres check
        try {
            if (pg_1.pgPool.options.connectionString) {
                await pg_1.pgPool.query('SELECT 1');
            }
        }
        catch (err) {
            status.ok = false;
            status.pg.ok = false;
            status.pg.error = err?.message ?? 'pg check failed';
        }
        // Redis check
        try {
            await (0, redis_1.pingRedis)();
        }
        catch (err) {
            status.ok = false;
            status.redis.ok = false;
            status.redis.error = err?.message ?? 'redis check failed';
        }
        const code = status.ok ? 200 : 500;
        return reply.status(code).send(status);
    });
    return app;
}
