import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT ?? '3000',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  PG_POOL_MAX: Number(process.env.PG_POOL_MAX ?? 20),
  PG_IDLE_TIMEOUT_MS: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30000),
  PG_STATEMENT_TIMEOUT_MS: Number(process.env.PG_STATEMENT_TIMEOUT_MS ?? 5000)
};


