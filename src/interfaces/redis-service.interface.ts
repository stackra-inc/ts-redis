/**
 * Redis Manager Interface
 *
 * Contract for the Redis manager. Implement this interface to provide
 * a custom Redis manager or to mock it in tests.
 *
 * @module interfaces/redis-service
 */

import type { RedisConnection } from './redis-connection.interface';

/**
 * IRedisService
 *
 * Defines the public API for managing Redis connections.
 * The concrete implementation is `RedisManager`.
 *
 * @example
 * ```typescript
 * class MyRedisManager implements IRedisService {
 *   async connection(name?: string): Promise<RedisConnection> {
 *     // custom implementation
 *   }
 *   // ...
 * }
 * ```
 */
export interface IRedisService {
  /**
   * Get a Redis connection by name.
   *
   * @param name - Connection name. Uses default if omitted.
   * @returns A promise resolving to the Redis connection
   */
  connection(name?: string): Promise<RedisConnection>;

  /**
   * Disconnect a specific connection.
   *
   * @param name - Connection name. Uses default if omitted.
   * @returns A promise that resolves when the connection is disconnected
   */
  disconnect(name?: string): Promise<void>;

  /**
   * Disconnect all active connections.
   *
   * @returns A promise that resolves when all connections are disconnected
   */
  disconnectAll(): Promise<void>;

  /**
   * Get all configured connection names.
   *
   * @returns An array of connection names from configuration
   */
  getConnectionNames(): string[];

  /**
   * Get the default connection name.
   *
   * @returns The default connection name
   */
  getDefaultConnectionName(): string;

  /**
   * Check if a connection is currently active (cached).
   *
   * @param name - Connection name. Uses default if omitted.
   * @returns True if the connection is active, false otherwise
   */
  isConnectionActive(name?: string): boolean;
}
