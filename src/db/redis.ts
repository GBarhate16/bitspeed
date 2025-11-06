import Redis from 'ioredis';
import { config } from '../config/env';

export const redis = new Redis(config.REDIS_URL);

export async function pingRedis(): Promise<string> {
  return redis.ping();
}


