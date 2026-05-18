/**
 * Redis Pipeline Interface
 *
 * Pipeline for batching multiple Redis commands into a single HTTP request.
 * Commands are queued and executed atomically when `exec()` is called.
 *
 * @module @stackra/ts-redis/interfaces/redis-pipeline
 */

import type { SetOptions } from "./set-options.interface";

/**
 * Pipeline interface for batching Redis commands.
 *
 * @remarks
 * Pipelines improve performance by sending multiple commands in a single
 * HTTP request. Commands are queued and executed atomically when exec() is called.
 *
 * @example
 * ```typescript
 * const results = await connection.pipeline()
 *   .set('key1', 'value1')
 *   .set('key2', 'value2')
 *   .get('key1')
 *   .del('key3')
 *   .exec();
 * ```
 */
export interface RedisPipeline {
  /**
   * Queue a GET command.
   *
   * @param key - The key to retrieve
   * @returns The pipeline instance for chaining
   */
  get(key: string): this;

  /**
   * Queue a SET command.
   *
   * @param key - The key to set
   * @param value - The value to store
   * @param options - Optional expiration settings
   * @returns The pipeline instance for chaining
   */
  set(key: string, value: string, options?: SetOptions): this;

  /**
   * Queue a DEL command.
   *
   * @param keys - The keys to delete
   * @returns The pipeline instance for chaining
   */
  del(...keys: string[]): this;

  /**
   * Execute all queued commands.
   *
   * @returns An array of results, one for each queued command
   */
  exec(): Promise<unknown[]>;
}
