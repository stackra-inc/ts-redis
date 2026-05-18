import { IDynamicModule, OnModuleInit, OnModuleDestroy } from '@stackra/ts-container';
import { RedisModuleOptions as RedisModuleOptions$1, RedisModuleAsyncOptions, RedisConnection, IRedisService, RedisConnector, IEventEmitter, SetOptions, RedisPipeline, RedisSubscriber, RedisConnectionConfig, IStore } from '@stackra/contracts';
import { MultipleInstanceManager } from '@stackra/ts-support';
import { Redis } from '@upstash/redis';

/**
 * Redis Module
 *
 * Configures the RedisManager and its dependencies for DI.
 * Use `RedisModule.forRoot(config)` or `RedisModule.forRootAsync(options)` in your AppModule imports.
 *
 * @module redis.module
 */

declare class RedisModule {
    /**
     * Logger instance scoped to the RedisModule context.
     */
    private static readonly logger;
    /**
     * Check if Redis credentials are configured.
     *
     * Returns `true` only when both VITE_UPSTASH_REDIS_REST_URL and
     * VITE_UPSTASH_REDIS_REST_TOKEN are set to non-empty values.
     */
    static hasCredentials(): boolean;
    /**
     * Configure the Redis module with static configuration.
     * Only registers if credentials are available.
     *
     * @param config - Redis configuration with named connections
     * @returns IDynamicModule with all Redis providers, or null if credentials are missing
     *
     * @example
     * ```typescript
     * @Module({
     *   imports: [
     *     RedisModule.forRoot({
     *       default: 'cache',
     *       connections: {
     *         cache: { url: '...', token: '...' },
     *         session: { url: '...', token: '...' },
     *       },
     *     }),
     *   ],
     * })
     * class AppModule {}
     * ```
     */
    static forRoot(config: RedisModuleOptions$1): IDynamicModule;
    /**
     * Configure the Redis module with async configuration.
     * Allows injecting dependencies (like ConfigService) to build the configuration dynamically.
     *
     * This follows the NestJS pattern for dynamic module configuration.
     *
     * @param options - Async configuration options with useFactory
     * @returns IDynamicModule with all Redis providers, or null if factory returns null
     *
     * @example
     * ```typescript
     * @Module({
     *   imports: [
     *     RedisModule.forRootAsync({
     *       imports: [ConfigModule],
     *       useFactory: (configService: ConfigService) => {
     *         const url = configService.get('UPSTASH_REDIS_REST_URL');
     *         const token = configService.get('UPSTASH_REDIS_REST_TOKEN');
     *
     *         if (!url || !token) {
     *           return null; // Skip registration
     *         }
     *
     *         return {
     *           default: 'cache',
     *           connections: {
     *             cache: { url, token },
     *           },
     *         };
     *       },
     *       inject: [ConfigService],
     *     }),
     *   ],
     * })
     * class AppModule {}
     * ```
     */
    static forRootAsync(options: RedisModuleAsyncOptions): IDynamicModule;
}

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
declare class RedisManager extends MultipleInstanceManager<RedisConnection> implements IRedisService, OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly connector;
    private readonly eventEmitter?;
    /**
     * Logger instance for Redis manager diagnostics.
     */
    private readonly logger;
    /**
     * @param config - Redis configuration with named connections
     * @param connector - Connector used to create Redis connections
     * @param eventEmitter - Optional event emitter for dispatching connection
     *   lifecycle events (`redis.connected`, `redis.disconnected`, `redis.error`).
     *   When `EventEmitterModule.forRoot()` is not in the app graph, this is
     *   `undefined` and `emit()` becomes a no-op.
     */
    constructor(config: RedisModuleOptions$1, connector: RedisConnector, eventEmitter?: IEventEmitter | undefined);
    /**
     * Eagerly warm the default connection on bootstrap.
     *
     * Skips silently if no connections are defined (e.g. no Upstash credentials).
     * Logs a warning if the default connection fails to warm.
     *
     * @returns A promise that resolves when the default connection is warmed
     */
    onModuleInit(): Promise<void>;
    /**
     * Disconnect all active connections on shutdown.
     *
     * @returns A promise that resolves when all connections are disconnected
     */
    onModuleDestroy(): Promise<void>;
    /**
     * Get the default instance name from configuration.
     *
     * @returns The default connection name
     */
    getDefaultInstance(): string;
    /**
     * Set the default instance name at runtime.
     *
     * @param name - The new default connection name
     */
    setDefaultInstance(name: string): void;
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
    getInstanceConfig(name: string): Record<string, any> | undefined;
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
    protected createDriver(_driver: string, _config: Record<string, any>): RedisConnection;
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
    protected createDriverAsync(_driver: string, config: Record<string, any>): Promise<RedisConnection>;
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
    connection(name?: string): Promise<RedisConnection>;
    /**
     * Disconnect a specific connection and remove it from cache.
     *
     * @param name - Connection name. Uses default if omitted.
     * @returns A promise that resolves when the connection is disconnected
     */
    disconnect(name?: string): Promise<void>;
    /**
     * Disconnect all active connections and clear the cache.
     *
     * @returns A promise that resolves when all connections are disconnected
     */
    disconnectAll(): Promise<void>;
    /**
     * Perform a health check on a specific connection using ping/echo.
     *
     * Attempts to execute a simple SET/GET cycle to verify the connection
     * is responsive. Returns `true` if the connection is healthy.
     *
     * @param name - Connection name. Uses default if omitted.
     * @returns `true` if the connection responds, `false` otherwise
     */
    healthCheck(name?: string): Promise<boolean>;
    /**
     * Get all configured connection names (from config).
     *
     * @returns An array of connection names
     */
    getConnectionNames(): string[];
    /**
     * Get the default connection name.
     *
     * @returns The default connection name from config
     */
    getDefaultConnectionName(): string;
    /**
     * Check if a connection has been resolved and is currently cached.
     *
     * @param name - Connection name. Uses default if omitted.
     * @returns True if the connection is active, false otherwise
     */
    isConnectionActive(name?: string): boolean;
    /**
     * Get all active (cached) connection names.
     *
     * @returns An array of currently active connection names
     */
    getActiveConnectionNames(): string[];
    /**
     * Attempt to reconnect a specific connection with retry logic.
     *
     * Disconnects the existing connection (if any), then attempts to
     * re-establish it with configurable retry behavior.
     *
     * @param name - Connection name. Uses default if omitted.
     * @param options - Retry configuration
     * @returns The reconnected RedisConnection
     * @throws {Error} If all retry attempts are exhausted
     */
    reconnect(name?: string, options?: {
        maxRetries?: number;
        delayMs?: number;
        backoffMultiplier?: number;
    }): Promise<RedisConnection>;
    /**
     * Dispatch a Redis lifecycle event through the optional event manager.
     *
     * No-ops silently when `EventEmitterModule` is not in the app graph
     * (the manager will be `undefined`). Event dispatch failures are
     * caught and ignored — they should never break Redis operations.
     *
     * @param event - The event name (use {@link RedisEvents}).
     * @param payload - Optional event payload.
     */
    private emit;
}

/**
 * Upstash Redis HTTP Connection Implementation
 *
 * This connection wraps the Upstash Redis HTTP client, providing a unified
 * interface for Redis operations in browser environments. All operations
 * are HTTP-based and don't require persistent TCP connections.
 *
 * @module connections/upstash
 */

/**
 * Upstash Redis connection implementation
 *
 * Wraps the Upstash Redis HTTP client to provide browser-compatible Redis operations.
 * All methods are async and use HTTP requests under the hood.
 *
 * Key features:
 * - Works in browsers (no Node.js required)
 * - No persistent connections
 * - Automatic request retries
 * - Pipeline support for batching
 *
 * @example
 * ```typescript
 * import { Redis } from '@upstash/redis';
 *
 * const redis = new Redis({
 *   url: 'https://my-redis.upstash.io',
 *   token: 'my-token',
 * });
 *
 * const connection = new UpstashConnection(redis, 'cache');
 *
 * // Use the connection
 * await connection.set('user:123', JSON.stringify(user), { ex: 3600 });
 * const data = await connection.get('user:123');
 * ```
 */
declare class UpstashConnection implements RedisConnection {
    private readonly redis;
    private readonly name;
    /**
     * Create a new Upstash connection
     *
     * @param redis - The Upstash Redis client instance
     * @param name - The unique identifier for this connection
     */
    constructor(redis: Redis, name: string);
    /**
     * Get the connection name
     *
     * @returns The unique identifier for this connection
     */
    getName(): string;
    /**
     * Get the underlying Upstash Redis client
     *
     * @returns The raw Upstash Redis instance
     *
     * @remarks
     * Use this for advanced operations not exposed through the interface.
     */
    client(): Redis;
    /**
     * Get the value of a key
     *
     * @param key - The key to retrieve
     * @returns The value stored at the key, or null if the key doesn't exist
     */
    get(key: string): Promise<string | null>;
    /**
     * Set the value of a key with optional expiration
     *
     * @param key - The key to set
     * @param value - The value to store
     * @param options - Optional settings for expiration and conditional setting
     * @returns 'OK' if successful, null if the operation failed
     *
     * @remarks
     * Handles different SET variants based on options:
     * - ex: Uses SETEX for second-precision expiration
     * - px: Uses PSETEX for millisecond-precision expiration
     * - nx: Uses SETNX for "set if not exists"
     * - xx: Uses SET XX for "set if exists"
     */
    set(key: string, value: string, options?: SetOptions): Promise<"OK" | null>;
    /**
     * Delete one or more keys
     *
     * @param keys - The keys to delete
     * @returns The number of keys that were deleted
     */
    del(...keys: string[]): Promise<number>;
    /**
     * Check if one or more keys exist
     *
     * @param keys - The keys to check
     * @returns The number of keys that exist
     */
    exists(...keys: string[]): Promise<number>;
    /**
     * Set a key's time to live in seconds
     *
     * @param key - The key to set expiration on
     * @param seconds - The number of seconds until expiration
     * @returns 1 if the timeout was set, 0 if the key doesn't exist
     */
    expire(key: string, seconds: number): Promise<number>;
    /**
     * Get the time to live for a key in seconds
     *
     * @param key - The key to check
     * @returns The remaining TTL in seconds, -1 if no expiration, -2 if key doesn't exist
     */
    ttl(key: string): Promise<number>;
    /**
     * Get the values of multiple keys
     *
     * @param keys - The keys to retrieve
     * @returns An array of values in the same order as the keys
     *
     * @remarks
     * More efficient than multiple GET calls as it uses a single HTTP request.
     */
    mget(...keys: string[]): Promise<(string | null)[]>;
    /**
     * Set multiple keys to multiple values
     *
     * @param data - An object mapping keys to values
     * @returns 'OK' if successful
     *
     * @remarks
     * This is an atomic operation — either all keys are set or none are.
     */
    mset(data: Record<string, string>): Promise<"OK">;
    /**
     * Increment the integer value of a key by 1
     *
     * @param key - The key to increment
     * @returns The value after incrementing
     */
    incr(key: string): Promise<number>;
    /**
     * Increment the integer value of a key by a specific amount
     *
     * @param key - The key to increment
     * @param increment - The amount to increment by
     * @returns The value after incrementing
     */
    incrby(key: string, increment: number): Promise<number>;
    /**
     * Decrement the integer value of a key by 1
     *
     * @param key - The key to decrement
     * @returns The value after decrementing
     */
    decr(key: string): Promise<number>;
    /**
     * Decrement the integer value of a key by a specific amount
     *
     * @param key - The key to decrement
     * @param decrement - The amount to decrement by
     * @returns The value after decrementing
     */
    decrby(key: string, decrement: number): Promise<number>;
    /**
     * Add a member to a sorted set with a score
     *
     * @param key - The sorted set key
     * @param score - The score for the member (typically a timestamp)
     * @param member - The member to add
     * @returns The number of elements added
     *
     * @remarks
     * Used internally for cache tag TTL tracking.
     */
    zadd(key: string, score: number, member: string): Promise<number>;
    /**
     * Get a range of members from a sorted set by index
     *
     * @param key - The sorted set key
     * @param start - The starting index (0-based)
     * @param stop - The ending index (-1 for last element)
     * @returns An array of members in the specified range
     */
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    /**
     * Remove one or more members from a sorted set
     *
     * @param key - The sorted set key
     * @param members - The members to remove
     * @returns The number of members removed
     */
    zrem(key: string, ...members: string[]): Promise<number>;
    /**
     * Remove all members in a sorted set with scores between min and max
     *
     * @param key - The sorted set key
     * @param min - The minimum score (inclusive)
     * @param max - The maximum score (inclusive)
     * @returns The number of members removed
     *
     * @remarks
     * Used for cleaning up expired cache entries.
     */
    zremrangebyscore(key: string, min: number, max: number): Promise<number>;
    /**
     * Execute a Lua script on the Redis server
     *
     * @param script - The Lua script to execute
     * @param keys - Array of keys that the script will access
     * @param args - Array of additional arguments to pass to the script
     * @returns The result of the script execution
     *
     * @remarks
     * Lua scripts execute atomically on the Redis server.
     */
    eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
    /**
     * Create a pipeline for batching multiple commands
     *
     * @returns A pipeline instance for chaining commands
     *
     * @remarks
     * Pipelines batch multiple commands into a single HTTP request,
     * significantly improving performance.
     */
    pipeline(): RedisPipeline;
    /**
     * Publish a message to a channel
     *
     * @param channel - The channel to publish to
     * @param message - The message to send
     * @returns The number of clients that received the message
     *
     * @remarks
     * This is a simple HTTP call — works in browsers, serverless, and edge.
     * Subscribers listening on the channel (via subscribe/psubscribe on
     * a server-side connection) will receive the message.
     */
    publish(channel: string, message: string): Promise<number>;
    /**
     * Subscribe to one or more channels
     *
     * @param channels - Channel name(s) to subscribe to
     * @returns A subscriber instance for listening to messages
     *
     * @remarks
     * Uses HTTP streaming under the hood. The returned subscriber
     * emits typed events when messages arrive.
     */
    subscribe<TMessage = unknown>(channels: string | string[]): RedisSubscriber<TMessage>;
    /**
     * Subscribe to channels matching a glob pattern
     *
     * @param patterns - Glob pattern(s) to match channel names
     * @returns A subscriber instance for listening to messages
     *
     * @remarks
     * Pattern subscriptions use glob-style matching (`*`, `?`, `[abc]`).
     */
    psubscribe<TMessage = unknown>(patterns: string | string[]): RedisSubscriber<TMessage>;
    /**
     * Incrementally iterate over keys matching a pattern
     *
     * @param cursor - The cursor position (use 0 to start)
     * @param options - Scan options (match pattern, count hint)
     * @returns A tuple of [nextCursor, keys]
     */
    scan(cursor: number, options?: {
        match?: string;
        count?: number;
    }): Promise<[number, string[]]>;
    /**
     * Delete all keys in the current database
     *
     * @returns 'OK' if successful
     *
     * @remarks
     * ⚠️ WARNING: This is a destructive operation that cannot be undone.
     */
    flushdb(): Promise<"OK">;
    /**
     * Disconnect from Redis
     *
     * @returns A promise that resolves when disconnected
     *
     * @remarks
     * For Upstash HTTP client, this is a no-op since there are no persistent
     * connections. Included for interface compatibility.
     */
    disconnect(): Promise<void>;
}

/**
 * Upstash Redis Connector
 *
 * Creates Upstash Redis connections from configuration.
 * This connector initializes the Upstash HTTP client and wraps it
 * in our connection interface.
 *
 * @module connectors/upstash
 */

/**
 * Upstash Redis connector implementation
 *
 * @remarks
 * This connector creates browser-compatible Redis connections using
 * the Upstash HTTP REST API. It handles client initialization and
 * configuration.
 *
 * The connector is injectable and can be used with dependency injection
 * frameworks like @stackra/ts-container.
 *
 * @example
 * ```typescript
 * const connector = new UpstashConnector();
 *
 * const connection = await connector.connect({
 *   url: 'https://my-redis.upstash.io',
 *   token: 'my-token',
 *   timeout: 5000,
 *   retry: {
 *     retries: 3,
 *     backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 3000)
 *   }
 * });
 *
 * // Use the connection
 * await connection.set('key', 'value');
 * ```
 */
declare class UpstashConnector implements RedisConnector {
    /**
     * Create a Redis connection from configuration
     *
     * @param config - The Upstash Redis configuration
     * @returns A promise that resolves to a Redis connection
     *
     * @throws {Error} If the configuration is invalid or connection fails
     *
     * @remarks
     * This method:
     * 1. Validates the configuration
     * 2. Creates an Upstash Redis HTTP client
     * 3. Wraps it in our connection interface
     * 4. Returns the connection ready for use
     *
     * The connection is lazy - it doesn't actually connect until the first
     * operation is performed (since HTTP is connectionless).
     */
    connect(config: RedisConnectionConfig): Promise<RedisConnection>;
}

/**
 * RedisStore — Redis-Backed Cache Store
 *
 * Implements the `IStore` interface from `@stackra/contracts` using
 * a Redis connection from the `RedisManager`. This enables Redis to
 * be used as a cache backend via `CacheModule.forFeature()`.
 *
 * All values are JSON-serialized before storage and deserialized on retrieval.
 * TTL is handled natively by Redis (SETEX/EXPIRE).
 *
 * ## Architecture
 *
 * ```
 * CacheManager → CacheService → RedisStore → RedisConnection (Upstash HTTP)
 * ```
 *
 * The store is registered dynamically by `RedisModule.forRoot()`,
 * or manually via `CacheModule.forFeature()`.
 *
 * @module @stackra/ts-redis/stores
 */

/**
 * Configuration options for the RedisStore.
 */
interface RedisStoreOptions {
    /** The Redis connection instance to use for cache operations. */
    connection: RedisConnection;
    /** Key prefix for all cache entries. Default: `"cache:"` */
    prefix?: string;
    /** Default TTL in seconds when not specified per-operation. Default: `300` */
    defaultTtl?: number;
}
/**
 * Redis-backed cache store implementing the `IStore` interface.
 *
 * Uses the Upstash HTTP Redis client under the hood. All operations
 * are async HTTP calls — works in browsers, serverless, and edge.
 *
 * @example
 * ```typescript
 * const store = new RedisStore({
 *   connection: await redisManager.connection("cache"),
 *   prefix: "app:cache:",
 *   defaultTtl: 600,
 * });
 *
 * await store.put("user:1", { name: "Alice" }, 3600);
 * const user = await store.get("user:1"); // { name: "Alice" }
 * ```
 */
declare class RedisStore implements IStore {
    /** The Redis connection used for all operations. */
    private readonly connection;
    /** Key prefix applied to all cache keys. */
    private readonly prefix;
    /** Default TTL in seconds. */
    private readonly defaultTtl;
    /**
     * Create a new RedisStore.
     *
     * @param options - Store configuration with connection, prefix, and TTL
     */
    constructor(options: RedisStoreOptions);
    /**
     * Retrieve a value by key from Redis.
     *
     * Values are JSON-deserialized on retrieval. Returns `undefined` if
     * the key doesn't exist or has expired (Redis handles TTL natively).
     *
     * @param key - The cache key (prefix is applied automatically)
     * @returns The cached value, or `undefined` if not found
     */
    get(key: string): Promise<unknown>;
    /**
     * Retrieve multiple values by keys from Redis.
     *
     * Uses MGET for efficient batch retrieval in a single HTTP request.
     *
     * @param keys - Array of cache keys
     * @returns Object mapping keys to values (`undefined` for missing)
     */
    many(keys: string[]): Promise<Record<string, unknown>>;
    /**
     * Store a value with a TTL in Redis.
     *
     * Values are JSON-serialized before storage. TTL is handled natively
     * by Redis via SETEX — no manual expiration tracking needed.
     *
     * @param key - The cache key
     * @param value - The value to store (will be JSON-serialized)
     * @param seconds - Time-to-live in seconds
     * @returns `true` if stored successfully
     */
    put(key: string, value: unknown, seconds: number): Promise<boolean>;
    /**
     * Store multiple key-value pairs with a shared TTL.
     *
     * Uses a Redis pipeline for efficient batch writes in a single HTTP request.
     *
     * @param values - Object mapping keys to values
     * @param seconds - Time-to-live in seconds
     * @returns `true` if all stored successfully
     */
    putMany(values: Record<string, unknown>, seconds: number): Promise<boolean>;
    /**
     * Store a value indefinitely (no expiration).
     *
     * Sets the value without a TTL — it persists until explicitly deleted
     * or the Redis instance is flushed.
     *
     * @param key - The cache key
     * @param value - The value to store
     * @returns `true` if stored successfully
     */
    forever(key: string, value: unknown): Promise<boolean>;
    /**
     * Increment a numeric value in Redis.
     *
     * Uses Redis INCRBY for atomic increment. If the key doesn't exist,
     * it's initialized to 0 before incrementing.
     *
     * @param key - The cache key
     * @param value - Amount to increment by (default: 1)
     * @returns The new value after incrementing
     */
    increment(key: string, value?: number): Promise<number>;
    /**
     * Decrement a numeric value in Redis.
     *
     * Uses Redis DECRBY for atomic decrement. If the key doesn't exist,
     * it's initialized to 0 before decrementing.
     *
     * @param key - The cache key
     * @param value - Amount to decrement by (default: 1)
     * @returns The new value after decrementing
     */
    decrement(key: string, value?: number): Promise<number>;
    /**
     * Remove a single item from Redis.
     *
     * @param key - The cache key to remove
     * @returns `true` if the key was deleted, `false` if it didn't exist
     */
    forget(key: string): Promise<boolean>;
    /**
     * Remove all items with this store's prefix from Redis.
     *
     * Uses SCAN to find all keys matching the store's prefix and deletes
     * them in batches. This is safe for shared Redis instances as it only
     * removes keys belonging to this store.
     *
     * @returns `true` if flushed successfully
     */
    flush(): Promise<boolean>;
    /**
     * Get the cache key prefix for this store.
     *
     * @returns The prefix string (e.g., `"cache:"`)
     */
    getPrefix(): string;
}

/**
 * Redis Connection Injection Decorator
 *
 * Provides `@InjectRedis(connectionName?)` which wraps
 * `@Inject(getRedisConnectionToken(connectionName))` from @stackra/ts-container.
 *
 * @module @stackra/ts-redis/decorators/inject-redis
 */
/**
 * Injects a {@link RedisConnection} for the specified connection.
 *
 * When used without arguments, injects the default Redis connection.
 * When a connection name is provided, injects the RedisConnection for that
 * specific named connection.
 *
 * Requires `RedisModule.forRoot()` to be imported in your application
 * and the connection name to be registered in the configuration.
 *
 * @param connectionName - Optional connection name. Uses `"default"` if omitted.
 * @returns A parameter/property decorator.
 *
 * @example
 * ```typescript
 * import { Injectable } from '@stackra/ts-container';
 * import { InjectRedis } from '@stackra/ts-redis';
 * import type { RedisConnection } from '@stackra/ts-redis';
 *
 * @Injectable()
 * class UserService {
 *   constructor(
 *     @InjectRedis() private redis: RedisConnection,             // default connection
 *     @InjectRedis('cache') private cacheRedis: RedisConnection  // named connection
 *   ) {}
 *
 *   async getUser(id: string) {
 *     const data = await this.redis.get(`user:${id}`);
 *     return data ? JSON.parse(data) : null;
 *   }
 * }
 * ```
 */
declare const InjectRedis: (connectionName?: string) => PropertyDecorator & ParameterDecorator;

/**
 * Redis Connection Token Utility
 *
 * Returns the DI injection token for a named Redis connection.
 * Used internally by `@InjectRedis()` and by `RedisModule.forRoot()`
 * to register per-connection providers.
 *
 * @module @stackra/ts-redis/decorators/get-redis-connection-token
 */
/**
 * Returns the DI injection token for a named Redis connection.
 *
 * The token follows the convention `"RedisConnection:<name>"` where `<name>`
 * is the connection name from the Redis configuration. When no name is
 * provided, it defaults to `"default"`.
 *
 * @param connectionName - The Redis connection name (e.g., "cache", "session").
 *   Defaults to `"default"` if omitted.
 * @returns The Redis connection injection token string.
 *
 * @example
 * ```typescript
 * getRedisConnectionToken();           // "RedisConnection:default"
 * getRedisConnectionToken('cache');    // "RedisConnection:cache"
 * getRedisConnectionToken('session');  // "RedisConnection:session"
 * ```
 */
declare const getRedisConnectionToken: (connectionName?: string) => string;

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
declare const InjectRedisManager: () => PropertyDecorator & ParameterDecorator;

/**
 * useRedis Hook
 *
 * Access the RedisManager in React components.
 *
 * @module hooks/use-redis
 */

/**
 * Hook to access the RedisManager in React components.
 *
 * @returns The RedisManager instance
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const redis = useRedis();
 *
 *   useEffect(() => {
 *     redis.connection('cache').then(conn => conn.get('key'));
 *   }, []);
 * }
 * ```
 */
declare function useRedis(): RedisManager;

/**
 * useRedisConnection Hook
 *
 * Get a specific Redis connection by name.
 * Returns a Promise — use with useEffect or React Suspense.
 *
 * @module hooks/use-redis-connection
 */

/**
 * Hook to get a specific Redis connection.
 *
 * @param name - Connection name (uses default if omitted)
 * @returns A Promise resolving to the RedisConnection
 *
 * @example
 * ```typescript
 * function CacheStatus() {
 *   const [connected, setConnected] = useState(false);
 *   const connectionPromise = useRedisConnection('cache');
 *
 *   useEffect(() => {
 *     connectionPromise.then(conn => {
 *       setConnected(true);
 *     });
 *   }, [connectionPromise]);
 *
 *   return <div>Connected: {String(connected)}</div>;
 * }
 * ```
 */
declare function useRedisConnection(name?: string): Promise<RedisConnection>;

/**
 * Define Config Utility
 *
 * Helper function to define Redis configuration with type safety.
 *
 * @module @stackra/ts-redis
 */

/**
 * Helper function to define Redis configuration with type safety
 *
 * Provides IDE autocomplete and type checking for configuration objects.
 * This pattern is consistent with modern tooling (Vite, Vitest, etc.).
 *
 * @param config - The Redis configuration object
 * @returns The same configuration object with proper typing
 *
 * @example
 * ```typescript
 * // redis.config.ts
 * import { defineConfig } from '@stackra/ts-redis';
 *
 * export default defineConfig({
 *   default: 'main',
 *   connections: {
 *     main: {
 *       url: import.meta.env.VITE_REDIS_URL,
 *       token: import.meta.env.VITE_REDIS_TOKEN,
 *     },
 *     cache: {
 *       url: import.meta.env.VITE_REDIS_CACHE_URL,
 *       token: import.meta.env.VITE_REDIS_CACHE_TOKEN,
 *     },
 *   },
 * });
 * ```
 */
declare function defineConfig(config: RedisModuleOptions$1): RedisModuleOptions$1;

/**
 * redis — Redis DI proxy
 *
 * Typed proxy for {@link RedisManager} from `@stackra/ts-redis`.
 *
 * Redis connection manager. Manages named Upstash Redis connections.
 *
 * The facade is a module-level constant typed as `RedisManager`.
 * It lazily resolves the service from the DI container on first property
 * access — safe to use at module scope before bootstrap completes.
 *
 * ## Setup (once, in main.tsx)
 *
 * ```typescript
 * import { Application } from '@stackra/ts-container';
 * import { inject } from "@stackra/ts-container";
 *
 * const app = await Application.create(AppModule);
 * Application.create(AppModule); // wires all facades
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { redis } from '@stackra/ts-redis';
 *
 * // Full autocomplete — no .proxy() call needed
 * redis.connection();
 * ```
 *
 * ## Available methods (from {@link RedisManager})
 *
 * - `connection(name?: string): Promise<RedisConnection>`
 * - `extend(driver: string, creator: DriverCreator<RedisConnection>): this`
 * - `getDefaultInstance(): string`
 *
 * ## Testing — swap in a mock
 *
 * ```typescript
 * import { inject } from "@stackra/ts-container";
 * import { RedisManager } from '@/services/redis-manager.service';
 *
 * // Before test — replace the resolved instance
 * inject.swap(RedisManager, mockInstance);
 *
 * // After test — restore
 * inject.clearAll();
 * ```
 *
 * @module facades/redis
 * @see {@link RedisManager} — the underlying service
 * @see {@link inject} — the lazy DI resolution function
 */

/**
 * redis — typed proxy for {@link RedisManager}.
 *
 * Resolves `RedisManager` from the DI container via the `RedisManager` token.
 * All property and method access is forwarded to the resolved instance
 * with correct `this` binding.
 *
 * Call `Application.create(AppModule)` once during bootstrap before using this.
 *
 * @example
 * ```typescript
 * redis.connection();
 * ```
 */
declare const redis: RedisManager;

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
declare class RedisError extends Error {
    /** Error name for identification. */
    readonly name: string;
    /** Error code for programmatic handling. */
    readonly code: string;
    /** Optional underlying cause. */
    readonly cause?: Error;
    /**
     * Create a new RedisError.
     *
     * @param message - Human-readable error message
     * @param cause   - Optional underlying error that caused this failure
     */
    constructor(message: string, cause?: Error);
}

/**
 * @fileoverview Redis connection error.
 * @module @stackra/ts-redis
 * @category Errors
 */

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
declare class RedisConnectionError extends RedisError {
    /** Error name for identification. */
    readonly name: string;
    /** Error code for programmatic handling. */
    readonly code: string;
}

/**
 * @fileoverview Redis configuration error.
 * @module @stackra/ts-redis
 * @category Errors
 */

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
declare class RedisModuleOptionsError extends RedisError {
    /** Error name for identification. */
    readonly name: string;
    /** Error code for programmatic handling. */
    readonly code: string;
}

/**
 * Redis Module Options Interface
 *
 * Global Redis configuration with multiple named connections.
 *
 * @module @stackra/ts-redis/interfaces/redis-module-options
 */

/**
 * Global Redis configuration with multiple named connections.
 *
 * @remarks
 * Allows you to configure multiple Redis connections for different purposes
 * (e.g., cache, sessions, rate limiting).
 *
 * @example
 * ```typescript
 * const config: RedisModuleOptions = {
 *   default: 'cache',
 *   connections: {
 *     cache: { url: '...', token: '...' },
 *     session: { url: '...', token: '...' },
 *   },
 * };
 * ```
 */
interface RedisModuleOptions {
    /**
     * Default connection name.
     *
     * @remarks
     * Must match one of the keys in the connections object.
     */
    default: string;
    /**
     * Named Redis connections.
     *
     * @remarks
     * A map of connection names to their configurations.
     */
    connections: Record<string, RedisConnectionConfig>;
    /**
     * Configuration for the Redis cache store.
     *
     * When RedisModule is imported, it automatically registers a "redis"
     * cache store into CacheModule via `forFeature()`. This config
     * controls the store's name, prefix, and TTL.
     */
    cacheStore?: {
        /** Store name registered in CacheManager. Default: `"redis"` */
        name?: string;
        /** Key prefix for cache entries. Default: `"cache:"` */
        prefix?: string;
        /** Default TTL in seconds. Default: `600` */
        ttl?: number;
        /** Which Redis connection to use for cache. Default: the `default` connection. */
        connection?: string;
    };
}

export { InjectRedis, InjectRedisManager, RedisConnectionError, RedisError, RedisManager, RedisModule, type RedisModuleOptions, RedisModuleOptionsError, RedisStore, UpstashConnection, UpstashConnector, defineConfig, getRedisConnectionToken, redis, useRedis, useRedisConnection };
