/**
 * RedisCacheStore — DI-Managed Redis Cache Store
 *
 * An `@Injectable()` + `@CacheStore()` decorated wrapper around the
 * Redis connection that implements `IStore`. Auto-discovered by the
 * `CacheStoreLoader` at bootstrap and registered with `CacheManager`.
 *
 * This eliminates the need for `RedisModule` to import `@stackra/ts-cache`
 * or call `CacheModule.forFeature()`. The cache package discovers this
 * store via the decorator metadata.
 *
 * ## Architecture
 *
 * ```
 * CacheManager → CacheStoreLoader discovers @CacheStore → RedisCacheStore
 *                                                              ↓
 *                                                        RedisManager.connection()
 * ```
 *
 * @module @stackra/ts-redis/stores
 */

import { Injectable, Inject } from "@stackra/ts-container";
import type { OnModuleInit } from "@stackra/ts-container";
import { CacheStore } from "@stackra/ts-cache";
import { REDIS_CONFIG } from "@stackra/contracts";
import type { IStore } from "@stackra/contracts";

import { RedisManager } from "@/services/redis-manager.service";
import type { RedisModuleOptions } from "@stackra/contracts";
import type { RedisConnection } from "@stackra/contracts";
import { Logger } from "@stackra/ts-logger";

/**
 * Redis-backed cache store, auto-discovered by `CacheStoreLoader`.
 *
 * Uses the `RedisManager` to get a connection and delegates all
 * cache operations to the Upstash HTTP Redis client.
 *
 * @example
 * ```typescript
 * // No manual registration needed — just import RedisModule.forRoot()
 * // and the store is automatically available as manager.store("redis")
 * ```
 */
@CacheStore({
  name: "redis",
  driver: "redis",
  config: { prefix: "cache:", ttl: 600 },
})
@Injectable()
export class RedisCacheStore implements IStore, OnModuleInit {
  /** Logger scoped to RedisCacheStore context. */
  private readonly logger = new Logger(RedisCacheStore.name);

  /** The resolved Redis connection. Set during `onModuleInit`. */
  private connection: RedisConnection | null = null;

  /** Key prefix for all cache entries. */
  private readonly prefix: string;

  /** Default TTL in seconds. */
  private readonly defaultTtl: number;

  public constructor(
    private readonly redisManager: RedisManager,
    @Inject(REDIS_CONFIG) private readonly config: RedisModuleOptions,
  ) {
    this.prefix = config.cacheStore?.prefix ?? "cache:";
    this.defaultTtl = config.cacheStore?.ttl ?? 600;
  }

  /**
   * Resolve the Redis connection on module init.
   */
  public async onModuleInit(): Promise<void> {
    try {
      const connectionName = this.config.cacheStore?.connection ?? this.config.default;
      this.connection = await this.redisManager.connection(connectionName);
      this.logger.info(`[RedisCacheStore] Connected via "${connectionName}" connection`);
    } catch (error: Error | any) {
      this.logger.warn(`[RedisCacheStore] Failed to connect: ${(error as Error).message}`);
    }
  }

  /**
   * Get the active connection or throw if not initialized.
   */
  private getConnection(): RedisConnection {
    if (!this.connection) {
      throw new Error("[RedisCacheStore] Not initialized — connection not available.");
    }
    return this.connection;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IStore Implementation
  // ══════════════════════════════════════════════════════════════════════════

  /** @inheritdoc */
  public async get(key: string): Promise<unknown> {
    const conn = this.getConnection();
    const raw = await conn.get(this.prefix + key);
    if (raw === null) return undefined;

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  /** @inheritdoc */
  public async many(keys: string[]): Promise<Record<string, unknown>> {
    if (keys.length === 0) return {};

    const conn = this.getConnection();
    const prefixedKeys = keys.map((k) => this.prefix + k);
    const values = await conn.mget(...prefixedKeys);

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

  /** @inheritdoc */
  public async put(key: string, value: unknown, seconds: number): Promise<boolean> {
    const conn = this.getConnection();
    const serialized = JSON.stringify(value);
    const ttl = seconds > 0 ? seconds : this.defaultTtl;
    const result = await conn.set(this.prefix + key, serialized, { ex: ttl });
    return result === "OK";
  }

  /** @inheritdoc */
  public async putMany(values: Record<string, unknown>, seconds: number): Promise<boolean> {
    const conn = this.getConnection();
    const ttl = seconds > 0 ? seconds : this.defaultTtl;
    const pipe = conn.pipeline();

    for (const [key, value] of Object.entries(values)) {
      const serialized = JSON.stringify(value);
      pipe.set(this.prefix + key, serialized, { ex: ttl });
    }

    await pipe.exec();
    return true;
  }

  /** @inheritdoc */
  public async forever(key: string, value: unknown): Promise<boolean> {
    const conn = this.getConnection();
    const serialized = JSON.stringify(value);
    const result = await conn.set(this.prefix + key, serialized);
    return result === "OK";
  }

  /** @inheritdoc */
  public async increment(key: string, value: number = 1): Promise<number> {
    const conn = this.getConnection();
    return conn.incrby(this.prefix + key, value);
  }

  /** @inheritdoc */
  public async decrement(key: string, value: number = 1): Promise<number> {
    const conn = this.getConnection();
    return conn.decrby(this.prefix + key, value);
  }

  /** @inheritdoc */
  public async forget(key: string): Promise<boolean> {
    const conn = this.getConnection();
    const deleted = await conn.del(this.prefix + key);
    return deleted > 0;
  }

  /** @inheritdoc */
  public async flush(): Promise<boolean> {
    const conn = this.getConnection();
    let cursor = 0;

    do {
      const [nextCursor, keys] = await conn.scan(cursor, {
        match: `${this.prefix}*`,
        count: 100,
      });
      cursor = nextCursor;

      if (keys.length > 0) {
        await conn.del(...keys);
      }
    } while (cursor !== 0);

    return true;
  }

  /** @inheritdoc */
  public getPrefix(): string {
    return this.prefix;
  }
}
