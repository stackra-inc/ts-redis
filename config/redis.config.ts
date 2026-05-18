/**
 * Redis Configuration
 *
 * Unified Redis configuration following Laravel and NestJS patterns.
 * All named connections and settings are defined in a single config object.
 *
 * Connections are resolved lazily at runtime using the Upstash HTTP API.
 * Each connection can point to a different Upstash Redis instance with
 * its own credentials, retry policy, and timeout settings.
 *
 * @module config/redis
 *
 * @example
 * ```typescript
 * import redisConfig from '@stackra/ts-redis/config';
 *
 * RedisModule.forRoot(redisConfig);
 * ```
 */

import { defineConfig } from "@stackra/ts-redis";

/**
 * Redis configuration
 *
 * Adapts to your environment via Vite environment variables.
 *
 * Environment Variables:
 * - VITE_REDIS_DEFAULT_CONNECTION: Default connection name (default: 'main')
 * - VITE_REDIS_GLOBAL: Register globally (default: true)
 * - VITE_UPSTASH_REDIS_REST_URL: Primary Upstash REST URL
 * - VITE_UPSTASH_REDIS_REST_TOKEN: Primary Upstash REST token
 * - VITE_UPSTASH_CACHE_REST_URL: Cache-specific Upstash REST URL (falls back to primary)
 * - VITE_UPSTASH_CACHE_REST_TOKEN: Cache-specific Upstash REST token (falls back to primary)
 * - VITE_UPSTASH_SESSION_REST_URL: Session-specific Upstash REST URL (falls back to primary)
 * - VITE_UPSTASH_SESSION_REST_TOKEN: Session-specific Upstash REST token (falls back to primary)
 */
const redisConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Global Registration
  |--------------------------------------------------------------------------
  |
  | When true, the RedisManager is available to all modules without
  | explicit imports. Recommended for most applications.
  |
  */
  isGlobal: true,

  /*
  |--------------------------------------------------------------------------
  | Default Connection
  |--------------------------------------------------------------------------
  |
  | The connection used when no specific name is passed to
  | `redis.connection()`. Must match one of the keys below.
  |
  */
  default: env("VITE_REDIS_DEFAULT_CONNECTION", "main"),

  /*
  |--------------------------------------------------------------------------
  | Redis Connections
  |--------------------------------------------------------------------------
  |
  | Each connection maps to an Upstash Redis instance. You can define
  | as many connections as you need — cache, session, rate-limiting, etc.
  |
  | All connections use the Upstash HTTP REST API, making them
  | browser-compatible with no persistent TCP connections.
  |
  */
  connections: {
    /**
     * Primary connection.
     *
     * Used as the default for general-purpose Redis operations.
     * Falls back to empty strings if env vars are not set — the
     * connector will throw a clear error at connection time.
     */
    main: {
      url: env("VITE_UPSTASH_REDIS_REST_URL", ""),
      token: env("VITE_UPSTASH_REDIS_REST_TOKEN", ""),
    },

    /**
     * Dedicated cache connection.
     *
     * Separate instance for cache data. Falls back to the primary
     * connection credentials if cache-specific ones aren't set.
     */
    cache: {
      url: env("VITE_UPSTASH_CACHE_REST_URL") || env("VITE_UPSTASH_REDIS_REST_URL", ""),
      token: env("VITE_UPSTASH_CACHE_REST_TOKEN") || env("VITE_UPSTASH_REDIS_REST_TOKEN", ""),
    },

    /**
     * Dedicated session connection.
     *
     * Separate instance for session data with potentially different
     * eviction policies. Falls back to primary credentials.
     */
    session: {
      url: env("VITE_UPSTASH_SESSION_REST_URL") || env("VITE_UPSTASH_REDIS_REST_URL", ""),
      token: env("VITE_UPSTASH_SESSION_REST_TOKEN") || env("VITE_UPSTASH_REDIS_REST_TOKEN", ""),
      timeout: 10000,
    },
  },
});

export default redisConfig;
