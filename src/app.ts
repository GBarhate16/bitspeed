import fastify from 'fastify';
import sensible from 'fastify-sensible';
import { pgPool } from './db/pg';
import { pingRedis } from './db/redis';

export function buildApp() {
  const app = fastify({ logger: true });

  app.register(sensible);

  app.get('/health', async (_request, reply) => {
    const status = {
      ok: true,
      pg: { ok: true as boolean, error: undefined as string | undefined },
      redis: { ok: true as boolean, error: undefined as string | undefined }
    };

    // Postgres check
    try {
      if (pgPool.options.connectionString) {
        await pgPool.query('SELECT 1');
      }
    } catch (err: any) {
      status.ok = false;
      status.pg.ok = false;
      status.pg.error = err?.message ?? 'pg check failed';
    }

    // Redis check
    try {
      await pingRedis();
    } catch (err: any) {
      status.ok = false;
      status.redis.ok = false;
      status.redis.error = err?.message ?? 'redis check failed';
    }

    const code = status.ok ? 200 : 500;
    return reply.status(code).send(status);
  });

  return app;
}


