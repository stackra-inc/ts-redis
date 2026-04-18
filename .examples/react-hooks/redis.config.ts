/**
 * React Hooks — Redis Configuration
 *
 * Configuration for React applications using the useRedis
 * and useRedisConnection hooks.
 */

import { defineConfig } from '@stackra/ts-redis';

const redisConfig = defineConfig({
  isGlobal: true,
  default: 'main',
  connections: {
    main: {
      url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL || '',
      token: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || '',
    },
    cache: {
      url:
        import.meta.env.VITE_UPSTASH_CACHE_REST_URL ||
        import.meta.env.VITE_UPSTASH_REDIS_REST_URL ||
        '',
      token:
        import.meta.env.VITE_UPSTASH_CACHE_REST_TOKEN ||
        import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN ||
        '',
    },
  },
});

export default redisConfig;
