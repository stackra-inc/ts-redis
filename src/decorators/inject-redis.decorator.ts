/**
 * Redis Connection Injection Decorator
 *
 * Provides `@InjectRedis(connectionName?)` which wraps
 * `@Inject(getRedisConnectionToken(connectionName))` from @stackra/ts-container.
 *
 * @module @stackra/ts-redis/decorators/inject-redis
 */

import { Inject } from "@stackra/ts-container";
import { getRedisConnectionToken } from "./../utils/get-redis-connection-token.util";

/**
 * Injects a {@link RedisConnection} for the specified connection.
 *
 * When used without arguments, injects the default Redis connection.
 * When a connection name is provided, injects the RedisConnection for that
 * specific named connection.
 *
 * Requires `RedisModule.forRoot()` to be imported in your application
 * and the connection name to be registered in the configuration.
 *
 * @param connectionName - Optional connection name. Uses `"default"` if omitted.
 * @returns A parameter/property decorator.
 *
 * @example
 * ```typescript
 * import { Injectable } from '@stackra/ts-container';
 * import { InjectRedis } from '@stackra/ts-redis';
 * import type { RedisConnection } from '@stackra/ts-redis';
 *
 * @Injectable()
 * class UserService {
 *   constructor(
 *     @InjectRedis() private redis: RedisConnection,             // default connection
 *     @InjectRedis('cache') private cacheRedis: RedisConnection  // named connection
 *   ) {}
 *
 *   async getUser(id: string) {
 *     const data = await this.redis.get(`user:${id}`);
 *     return data ? JSON.parse(data) : null;
 *   }
 * }
 * ```
 */
export const InjectRedis = (connectionName?: string): PropertyDecorator & ParameterDecorator =>
  Inject(getRedisConnectionToken(connectionName));
