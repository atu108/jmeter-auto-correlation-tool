import env from '../utility/env';

const redis = {
  host: env('REDIS_HOST', '127.0.0.1'),
  port: env('REDIS_PORT', 6379),
  /**
   * Redis use database name as index by default its provides 1-15 indexes
   */
  db: env('REDIS_DB', 1),
  password: env('REDIS_PASSWORD', '')
};

export default redis;
