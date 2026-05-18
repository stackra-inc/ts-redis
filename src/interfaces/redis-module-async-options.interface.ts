/**
 * @fileoverview Redis module async options interface
 * @module @stackra/ts-redis
 */

import type { RedisModuleOptions } from "./redis-module-options.interface";

/**
 * Options for async Redis module configuration.
 * Follows the NestJS pattern for dynamic module configuration.
 */
export interface RedisModuleAsyncOptions {
  /**
   * Factory function that returns the Redis configuration.
   * Can inject dependencies via the `inject` array.
   *
   * @example
   * ```typescript
   * RedisModule.forRootAsync({
   *   useFactory: (configService: ConfigService) => ({
   *     default: configService.get('REDIS_DEFAULT_CONNECTION'),
   *     connections: {
   *       cache: {
   *         url: configService.get('UPSTASH_REDIS_REST_URL'),
   *         token: configService.get('UPSTASH_REDIS_REST_TOKEN'),
   *       },
   *     },
   *   }),
   *   inject: [ConfigService],
   * })
   * ```
   */
  useFactory?: (...args: any[]) => RedisModuleOptions | Promise<RedisModuleOptions>;

  /**
   * Dependencies to inject into the factory function.
   * These will be resolved from the DI container and passed to `useFactory`.
   */
  inject?: any[];

  /**
   * Import modules that provide the injected dependencies.
   */
  imports?: any[];
}
