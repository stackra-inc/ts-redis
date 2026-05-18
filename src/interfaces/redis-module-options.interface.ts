/**
 * Redis Module Options Interface
 *
 * Global Redis configuration with multiple named connections.
 *
 * @module @stackra/ts-redis/interfaces/redis-module-options
 */

import type { RedisConnectionConfig } from "@stackra/contracts";

/**
 * Global Redis configuration with multiple named connections.
 *
 * @remarks
 * Allows you to configure multiple Redis connections for different purposes
 * (e.g., cache, sessions, rate limiting).
 *
 * @example
 * ```typescript
 * const config: RedisModuleOptions = {
 *   default: 'cache',
 *   connections: {
 *     cache: { url: '...', token: '...' },
 *     session: { url: '...', token: '...' },
 *   },
 * };
 * ```
 */
export interface RedisModuleOptions {
  /**
   * Default connection name.
   *
   * @remarks
   * Must match one of the keys in the connections object.
   */
  default: string;

  /**
   * Named Redis connections.
   *
   * @remarks
   * A map of connection names to their configurations.
   */
  connections: Record<string, RedisConnectionConfig>;

  /**
   * Configuration for the Redis cache store.
   *
   * When RedisModule is imported, it automatically registers a "redis"
   * cache store into CacheModule via `forFeature()`. This config
   * controls the store's name, prefix, and TTL.
   */
  cacheStore?: {
    /** Store name registered in CacheManager. Default: `"redis"` */
    name?: string;
    /** Key prefix for cache entries. Default: `"cache:"` */
    prefix?: string;
    /** Default TTL in seconds. Default: `600` */
    ttl?: number;
    /** Which Redis connection to use for cache. Default: the `default` connection. */
    connection?: string;
  };
}
