/**
 * Redis Connection Token Utility
 *
 * Returns the DI injection token for a named Redis connection.
 * Used internally by `@InjectRedis()` and by `RedisModule.forRoot()`
 * to register per-connection providers.
 *
 * @module @stackra/ts-redis/decorators/get-redis-connection-token
 */

/**
 * Returns the DI injection token for a named Redis connection.
 *
 * The token follows the convention `"RedisConnection:<name>"` where `<name>`
 * is the connection name from the Redis configuration. When no name is
 * provided, it defaults to `"default"`.
 *
 * @param connectionName - The Redis connection name (e.g., "cache", "session").
 *   Defaults to `"default"` if omitted.
 * @returns The Redis connection injection token string.
 *
 * @example
 * ```typescript
 * getRedisConnectionToken();           // "RedisConnection:default"
 * getRedisConnectionToken('cache');    // "RedisConnection:cache"
 * getRedisConnectionToken('session');  // "RedisConnection:session"
 * ```
 */
export const getRedisConnectionToken = (connectionName: string = "default"): string =>
  `RedisConnection:${connectionName}`;
