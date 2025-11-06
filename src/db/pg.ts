import { Pool } from 'pg';
import { config } from '../config/env';

export const pgPool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.PG_POOL_MAX,
  idleTimeoutMillis: config.PG_IDLE_TIMEOUT_MS,
  statement_timeout: config.PG_STATEMENT_TIMEOUT_MS
});


