/**
 * Multiple Connections Configuration
 *
 * Demonstrates configuring multiple named Redis connections for
 * different purposes: cache, sessions, and rate limiting.
 *
 * Each connection can point to a different Upstash Redis instance
 * with its own credentials, retry policy, and timeout.
 *
 * Environment Variables:
 * - VITE_UPSTASH_REDIS_REST_URL / TOKEN: Primary (default) connection
 * - VITE_UPSTASH_CACHE_REST_URL / TOKEN: Cache connection
 * - VITE_UPSTASH_SESSION_REST_URL / TOKEN: Session connection
 * - VITE_UPSTASH_RATELIMIT_REST_URL / TOKEN: Rate-limit connection
 */

import { defineConfig } from '@stackra/ts-redis';

const redisConfig = defineConfig({
  isGlobal: true,

  /**
   * Default connection used when no name is passed to `redis.connection()`.
   */
  default: import.meta.env.VITE_REDIS_DEFAULT_CONNECTION || 'cache',

  connections: {
    /**
     * Cache connection — general-purpose caching.
     */
    cache: {
      url: import.meta.env.VITE_UPSTASH_CACHE_REST_URL || '',
      token: import.meta.env.VITE_UPSTASH_CACHE_REST_TOKEN || '',
      enableAutoPipelining: true,
    },

    /**
     * Session connection — user session storage.
     * Longer timeout for reliability.
     */
    session: {
      url: import.meta.env.VITE_UPSTASH_SESSION_REST_URL || '',
      token: import.meta.env.VITE_UPSTASH_SESSION_REST_TOKEN || '',
      timeout: 10000,
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 5000),
      },
    },

    /**
     * Rate-limit connection — API rate limiting.
     * Auto-pipelining for high-throughput counter operations.
     */
    ratelimit: {
      url: import.meta.env.VITE_UPSTASH_RATELIMIT_REST_URL || '',
      token: import.meta.env.VITE_UPSTASH_RATELIMIT_REST_TOKEN || '',
      enableAutoPipelining: true,
      retry: {
        retries: 2,
        backoff: (retryCount) => Math.min(100 * 2 ** retryCount, 1000),
      },
    },
  },
});

export default redisConfig;
