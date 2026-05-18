/**
 * @fileoverview Base error class for the Redis package.
 * @module @stackra/ts-redis
 * @category Errors
 */

/**
 * Base error class for all errors thrown by the Redis package.
 *
 * All specific error classes extend this to provide a consistent
 * error shape with a typed `code` property for programmatic handling.
 *
 * @example
 * ```typescript
 * try {
 *   await redis.connection('cache').get('key');
 * } catch (error: Error | any) {
 *   if (error instanceof RedisError) {
 *     logger.error('Redis error:', error.code, error.message);
 *   }
 * }
 * ```
 */
export class RedisError extends Error {
  /** Error name for identification. */
  public readonly name: string = "RedisError";

  /** Error code for programmatic handling. */
  public readonly code: string = "REDIS_ERROR";

  /** Optional underlying cause. */
  public readonly cause?: Error;

  /**
   * Create a new RedisError.
   *
   * @param message - Human-readable error message
   * @param cause   - Optional underlying error that caused this failure
   */
  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;

    if (typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}
