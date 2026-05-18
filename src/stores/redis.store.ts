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

import type { IStore } from "@stackra/contracts";
import type { RedisConnection } from "@stackra/contracts";

/**
 * Configuration options for the RedisStore.
 */
export interface RedisStoreOptions {
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
export class RedisStore implements IStore {
  /** The Redis connection used for all operations. */
  private readonly connection: RedisConnection;

  /** Key prefix applied to all cache keys. */
  private readonly prefix: string;

  /** Default TTL in seconds. */
  private readonly defaultTtl: number;

  /**
   * Create a new RedisStore.
   *
   * @param options - Store configuration with connection, prefix, and TTL
   */
  public constructor(options: RedisStoreOptions) {
    this.connection = options.connection;
    this.prefix = options.prefix ?? "cache:";
    this.defaultTtl = options.defaultTtl ?? 300;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IStore Implementation
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Retrieve a value by key from Redis.
   *
   * Values are JSON-deserialized on retrieval. Returns `undefined` if
   * the key doesn't exist or has expired (Redis handles TTL natively).
   *
   * @param key - The cache key (prefix is applied automatically)
   * @returns The cached value, or `undefined` if not found
   */
  public async get(key: string): Promise<unknown> {
    const raw = await this.connection.get(this.prefix + key);
    if (raw === null) return undefined;

    try {
      return JSON.parse(raw);
    } catch {
      // If it's not valid JSON, return the raw string
      return raw;
    }
  }

  /**
   * Retrieve multiple values by keys from Redis.
   *
   * Uses MGET for efficient batch retrieval in a single HTTP request.
   *
   * @param keys - Array of cache keys
   * @returns Object mapping keys to values (`undefined` for missing)
   */
  public async many(keys: string[]): Promise<Record<string, unknown>> {
    if (keys.length === 0) return {};

    const prefixedKeys = keys.map((k) => this.prefix + k);
    const values = await this.connection.mget(...prefixedKeys);

    const results: Record<string, unknown> = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const raw = values[i];
      if (raw === null || raw === undefined) {
        results[key] = undefined;
      } else {
        try {
          results[key] = JSON.parse(raw);
        } catch {
          results[key] = raw;
        }
      }
    }

    return results;
  }

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
  public async put(key: string, value: unknown, seconds: number): Promise<boolean> {
    const serialized = JSON.stringify(value);
    const ttl = seconds > 0 ? seconds : this.defaultTtl;
    const result = await this.connection.set(this.prefix + key, serialized, { ex: ttl });
    return result === "OK";
  }

  /**
   * Store multiple key-value pairs with a shared TTL.
   *
   * Uses a Redis pipeline for efficient batch writes in a single HTTP request.
   *
   * @param values - Object mapping keys to values
   * @param seconds - Time-to-live in seconds
   * @returns `true` if all stored successfully
   */
  public async putMany(values: Record<string, unknown>, seconds: number): Promise<boolean> {
    const ttl = seconds > 0 ? seconds : this.defaultTtl;
    const pipe = this.connection.pipeline();

    for (const [key, value] of Object.entries(values)) {
      const serialized = JSON.stringify(value);
      pipe.set(this.prefix + key, serialized, { ex: ttl });
    }

    await pipe.exec();
    return true;
  }

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
  public async forever(key: string, value: unknown): Promise<boolean> {
    const serialized = JSON.stringify(value);
    const result = await this.connection.set(this.prefix + key, serialized);
    return result === "OK";
  }

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
  public async increment(key: string, value: number = 1): Promise<number> {
    return this.connection.incrby(this.prefix + key, value);
  }

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
  public async decrement(key: string, value: number = 1): Promise<number> {
    return this.connection.decrby(this.prefix + key, value);
  }

  /**
   * Remove a single item from Redis.
   *
   * @param key - The cache key to remove
   * @returns `true` if the key was deleted, `false` if it didn't exist
   */
  public async forget(key: string): Promise<boolean> {
    const deleted = await this.connection.del(this.prefix + key);
    return deleted > 0;
  }

  /**
   * Remove all items with this store's prefix from Redis.
   *
   * Uses SCAN to find all keys matching the store's prefix and deletes
   * them in batches. This is safe for shared Redis instances as it only
   * removes keys belonging to this store.
   *
   * @returns `true` if flushed successfully
   */
  public async flush(): Promise<boolean> {
    let cursor = 0;

    do {
      const [nextCursor, keys] = await this.connection.scan(cursor, {
        match: `${this.prefix}*`,
        count: 100,
      });
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.connection.del(...keys);
      }
    } while (cursor !== 0);

    return true;
  }

  /**
   * Get the cache key prefix for this store.
   *
   * @returns The prefix string (e.g., `"cache:"`)
   */
  public getPrefix(): string {
    return this.prefix;
  }
}
