/**
 * @fileoverview Redis configuration error.
 * @module @stackra/ts-redis
 * @category Errors
 */

import { RedisError } from "./redis.error";

/**
 * Error thrown when the Redis module configuration is invalid or incomplete.
 *
 * Typical causes:
 * - Missing `url` or `token` in the connection config
 * - Referencing a connection name that is not defined in the config
 * - Invalid values for TTLs, retry, or other config fields
 *
 * @example
 * ```typescript
 * try {
 *   await connector.connect({ url: '' } as any);
 * } catch (error: Error | any) {
 *   if (error instanceof RedisModuleOptionsError) {
 *     logger.error('Bad Redis config:', error.message);
 *   }
 * }
 * ```
 */
export class RedisModuleOptionsError extends RedisError {
  /** Error name for identification. */
  public override readonly name: string = "RedisModuleOptionsError";

  /** Error code for programmatic handling. */
  public override readonly code: string = "REDIS_CONFIG_ERROR";
}
