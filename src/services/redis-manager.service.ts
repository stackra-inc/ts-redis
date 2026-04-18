/**
 * Redis Manager
 *
 * Manages multiple named Redis connections. Each connection is lazily
 * resolved via the configured connector, cached, and reused.
 *
 * Extends `MultipleInstanceManager<RedisConnection>` and uses the
 * async resolution path (`instanceAsync` / `createDriverAsync`) since
 * Redis connections require async initialization.
 *
 * Lifecycle:
 * - `OnModuleInit` — eagerly warms the default connection
 * - `OnModuleDestroy` — disconnects all active connections
 *
 * @module services/redis-manager
 */

import { Injectable, Inject, type OnModuleInit, type OnModuleDestroy } from '@stackra/ts-container';
import { MultipleInstanceManager } from '@stackra/ts-support';

import type { RedisConnection, RedisConnector, RedisConfig, IRedisService } from '@/interfaces';
import { REDIS_CONFIG, REDIS_CONNECTOR } from '@/constants/tokens.constant';

/**
 * RedisManager — the single entry point for Redis in your app.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(@Inject(RedisManager) private redis: RedisManager) {}
 *
 *   async getUser(id: string) {
 *     const conn = await this.redis.connection('cache');
 *     const data = await conn.get(`user:${id}`);
 *     return data ? JSON.parse(data) : null;
 *   }
 * }
 * ```
 */
@Injectable()
export class RedisManager
  extends MultipleInstanceManager<RedisConnection>
  implements IRedisService, OnModuleInit, OnModuleDestroy
{
  /**
   * @param config - Redis configuration with named connections
   * @param connector - Connector used to create Redis connections
   */
  constructor(
    @Inject(REDIS_CONFIG) private readonly config: RedisConfig,
    @Inject(REDIS_CONNECTOR) private readonly connector: RedisConnector
  ) {
    super();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle hooks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Eagerly warm the default connection on bootstrap.
   *
   * Skips silently if no connections are defined (e.g. no Upstash credentials).
   * Logs a warning if the default connection fails to warm.
   *
   * @returns A promise that resolves when the default connection is warmed
   */
  public async onModuleInit(): Promise<void> {
    // Only warm the default connection if it's configured.
    // Skip silently if no connections are defined (e.g. no Upstash credentials).
    const defaultName = this.config.default;
    if (this.config.connections[defaultName]) {
      try {
        await this.connection();
      } catch (err) {
        console.warn(
          `[RedisManager] Failed to warm default connection '${defaultName}':`,
          (err as Error).message
        );
      }
    }
  }

  /**
   * Disconnect all active connections on shutdown.
   *
   * @returns A promise that resolves when all connections are disconnected
   */
  public async onModuleDestroy(): Promise<void> {
    await this.disconnectAll();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MultipleInstanceManager contract
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get the default instance name from configuration.
   *
   * @returns The default connection name
   */
  public getDefaultInstance(): string {
    return this.config.default;
  }

  /**
   * Set the default instance name at runtime.
   *
   * @param name - The new default connection name
   */
  public setDefaultInstance(name: string): void {
    this.config.default = name;
  }

  /**
   * Get the configuration for a specific connection.
   *
   * Adds a synthetic `driver` field so the base class's `resolveAsync()`
   * can find it. Redis always uses the injected connector — the driver
   * name is informational only.
   *
   * @param name - The connection name
   * @returns The connection configuration, or undefined if not found
   */
  public getInstanceConfig(name: string): Record<string, any> | undefined {
    const connectionConfig = this.config.connections[name];
    if (!connectionConfig) return undefined;

    return { driver: 'upstash', ...connectionConfig };
  }

  /**
   * Sync driver creation — not used for Redis.
   *
   * Redis always uses the async path via `createDriverAsync()`.
   *
   * @param _driver - The driver name (unused)
   * @param _config - The driver configuration (unused)
   * @returns Never — always throws
   *
   * @throws {Error} Always throws; use `connection()` for async resolution
   */
  protected createDriver(_driver: string, _config: Record<string, any>): RedisConnection {
    throw new Error('RedisManager: use connection() for async resolution.');
  }

  /**
   * Async driver creation — creates a Redis connection via the connector.
   *
   * Called by the base class's `instanceAsync()` when no cached
   * instance exists. The connector handles the actual connection
   * setup (Upstash HTTP client, etc.).
   *
   * @param _driver - The driver name (unused, always 'upstash')
   * @param config - The connection configuration
   * @returns A promise resolving to the created Redis connection
   */
  protected async createDriverAsync(
    _driver: string,
    config: Record<string, any>
  ): Promise<RedisConnection> {
    return this.connector.connect(config as any);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API — Connection management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get a Redis connection by name.
   *
   * Connections are lazily created and cached. The first call for a
   * given name creates the connection via the connector. Subsequent
   * calls return the cached connection instantly.
   *
   * Deduplicates in-flight resolutions — if two callers request
   * the same connection simultaneously, they share one Promise.
   *
   * @param name - Connection name from config. Uses default if omitted.
   * @returns A promise resolving to the Redis connection
   */
  public async connection(name?: string): Promise<RedisConnection> {
    return this.instanceAsync(name);
  }

  /**
   * Disconnect a specific connection and remove it from cache.
   *
   * @param name - Connection name. Uses default if omitted.
   * @returns A promise that resolves when the connection is disconnected
   */
  public async disconnect(name?: string): Promise<void> {
    const connectionName = name ?? this.config.default;

    if (this.hasInstance(connectionName)) {
      const conn = this.instance(connectionName);
      await conn.disconnect();
      this.forgetInstance(connectionName);
    }
  }

  /**
   * Disconnect all active connections and clear the cache.
   *
   * @returns A promise that resolves when all connections are disconnected
   */
  public async disconnectAll(): Promise<void> {
    const names = this.getResolvedInstances();
    await Promise.all(names.map((n) => this.disconnect(n)));
    this.purge();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API — Introspection
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all configured connection names (from config).
   *
   * @returns An array of connection names
   */
  public getConnectionNames(): string[] {
    return Object.keys(this.config.connections);
  }

  /**
   * Get the default connection name.
   *
   * @returns The default connection name from config
   */
  public getDefaultConnectionName(): string {
    return this.config.default;
  }

  /**
   * Check if a connection has been resolved and is currently cached.
   *
   * @param name - Connection name. Uses default if omitted.
   * @returns True if the connection is active, false otherwise
   */
  public isConnectionActive(name?: string): boolean {
    return this.hasInstance(name ?? this.config.default);
  }

  /**
   * Get all active (cached) connection names.
   *
   * @returns An array of currently active connection names
   */
  public getActiveConnectionNames(): string[] {
    return this.getResolvedInstances();
  }
}
