/**
 * Redis Connector Interface
 *
 * The connector is responsible for creating Redis connections from configuration.
 * This abstraction allows for different connection strategies and makes testing easier.
 *
 * @module interfaces/redis-connector
 */

import type { RedisConnection } from './redis-connection.interface';
import type { RedisConnectionConfig } from './redis-config.interface';

/**
 * Connector creates Redis connections from configuration
 *
 * @remarks
 * The connector pattern separates connection creation logic from connection management.
 * This makes it easy to swap connection implementations (e.g., for testing) without
 * changing the rest of the codebase.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UpstashConnector implements RedisConnector {
 *   async connect(config: RedisConnectionConfig): Promise<RedisConnection> {
 *     const client = new Redis({
 *       url: config.url,
 *       token: config.token,
 *     });
 *     return new UpstashConnection(client, 'default');
 *   }
 * }
 * ```
 */
export interface RedisConnector {
  /**
   * Create a Redis connection from configuration
   *
   * @param config - The connection configuration
   * @returns A promise that resolves to a Redis connection
   *
   * @throws {Error} If the connection cannot be established
   *
   * @example
   * ```typescript
   * const connector = new UpstashConnector();
   * const connection = await connector.connect({
   *   url: 'https://my-redis.upstash.io',
   *   token: 'my-token',
   * });
   *
   * await connection.set('key', 'value');
   * ```
   */
  connect(config: RedisConnectionConfig): Promise<RedisConnection>;
}
