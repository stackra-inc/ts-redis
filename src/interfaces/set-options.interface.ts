/**
 * Set Options Interface
 *
 * Options for the Redis SET command controlling expiration and
 * conditional setting behavior.
 *
 * @module @stackra/ts-redis/interfaces/set-options
 */

/**
 * Options for SET command.
 *
 * @remarks
 * These options control expiration and conditional setting behavior.
 * Only one expiration option (ex or px) should be used at a time.
 *
 * @example
 * ```typescript
 * // Expire in 1 hour
 * const opts1: SetOptions = { ex: 3600 };
 *
 * // Set only if key doesn't exist
 * const opts2: SetOptions = { nx: true };
 * ```
 */
export interface SetOptions {
  /**
   * Set the expiration time in seconds.
   *
   * @remarks
   * Cannot be used together with px option.
   */
  ex?: number;

  /**
   * Set the expiration time in milliseconds.
   *
   * @remarks
   * Cannot be used together with ex option.
   */
  px?: number;

  /**
   * Only set the key if it does not already exist.
   */
  nx?: boolean;

  /**
   * Only set the key if it already exists.
   */
  xx?: boolean;
}
