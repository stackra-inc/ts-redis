/**
 * @fileoverview RedisManager injection decorator.
 *
 * Provides `@InjectRedisManager()` which wraps
 * `@Inject(REDIS_MANAGER)` from @stackra/ts-container.
 *
 * This follows the same pattern as `@InjectEntityManager()` in
 * `@stackra/ts-orm`.
 *
 * @module decorators/inject-redis-manager
 * @category Decorators
 */

import { Inject } from "@stackra/ts-container";

import { REDIS_MANAGER } from "@stackra/contracts";

/**
 * Injects the {@link RedisManager} from the DI container.
 *
 * Use this when you need direct access to the RedisManager for
 * advanced operations like switching connections at runtime,
 * disconnecting connections, or introspecting the configuration.
 *
 * For most use cases, prefer `@InjectRedis()` which gives you a
 * `RedisConnection` directly.
 *
 * @returns A parameter/property decorator.
 *
 * @example
 * ```typescript
 * import { Injectable } from '@stackra/ts-container';
 * import { InjectRedisManager, RedisManager } from '@stackra/ts-redis';
 *
 * @Injectable()
 * class RedisAdminService {
 *   constructor(@InjectRedisManager() private manager: RedisManager) {}
 *
 *   async disconnectAll(): Promise<void> {
 *     await this.manager.disconnectAll();
 *   }
 *
 *   getActiveConnections(): string[] {
 *     return this.manager.getActiveConnectionNames();
 *   }
 * }
 * ```
 */
export const InjectRedisManager = (): PropertyDecorator & ParameterDecorator =>
  Inject(REDIS_MANAGER);
