/**
 * @fileoverview Redis connection error.
 * @module @stackra/ts-redis
 * @category Errors
 */

import { RedisError } from "./redis.error";

/**
 * Error thrown when a Redis connection cannot be established or is lost.
 *
 * Typical causes:
 * - Network failure reaching the Upstash REST endpoint
 * - Authentication/authorization failure with the provided token
 * - Connection dropped by the remote server
 *
 * @example
 * ```typescript
 * try {
 *   await manager.connection('cache');
 * } catch (error: Error | any) {
 *   if (error instanceof RedisConnectionError) {
 *     logger.error('Cannot reach Redis:', error.message);
 *   }
 * }
 * ```
 */
export class RedisConnectionError extends RedisError {
  /** Error name for identification. */
  public override readonly name: string = "RedisConnectionError";

  /** Error code for programmatic handling. */
  public override readonly code: string = "REDIS_CONNECTION_ERROR";
}
