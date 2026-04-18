/**
 * Upstash Redis HTTP Connection Implementation
 *
 * This connection wraps the Upstash Redis HTTP client, providing a unified
 * interface for Redis operations in browser environments. All operations
 * are HTTP-based and don't require persistent TCP connections.
 *
 * @module connections/upstash
 */

import type { Redis } from '@upstash/redis';
import type { RedisConnection, RedisPipeline, SetOptions, RedisSubscriber } from '@/interfaces';

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
export class UpstashConnection implements RedisConnection {
  /**
   * Create a new Upstash connection
   *
   * @param redis - The Upstash Redis client instance
   * @param name - The unique identifier for this connection
   */
  constructor(
    private readonly redis: Redis,
    private readonly name: string
  ) {}

  /**
   * Get the connection name
   *
   * @returns The unique identifier for this connection
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get the underlying Upstash Redis client
   *
   * @returns The raw Upstash Redis instance
   *
   * @remarks
   * Use this for advanced operations not exposed through the interface.
   */
  public client(): Redis {
    return this.redis;
  }

  // ============================================================================
  // Basic Key-Value Operations
  // ============================================================================

  /**
   * Get the value of a key
   *
   * @param key - The key to retrieve
   * @returns The value stored at the key, or null if the key doesn't exist
   */
  public async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

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
  public async set(key: string, value: string, options?: SetOptions): Promise<'OK' | null> {
    // Handle expiration in seconds
    if (options?.ex) {
      const result = await this.redis.setex(key, options.ex, value);
      return result as 'OK';
    }

    // Handle expiration in milliseconds
    if (options?.px) {
      const result = await this.redis.psetex(key, options.px, value);
      return result as 'OK';
    }

    // Handle "set if not exists"
    if (options?.nx) {
      const result = await this.redis.setnx(key, value);
      return result ? 'OK' : null;
    }

    // Handle "set if exists" or plain SET
    if (options?.xx) {
      // Upstash doesn't have a direct SET XX command, so we check existence first
      const exists = await this.redis.exists(key);
      if (!exists) {
        return null;
      }
    }

    const result = await this.redis.set(key, value);
    return result as 'OK';
  }

  /**
   * Delete one or more keys
   *
   * @param keys - The keys to delete
   * @returns The number of keys that were deleted
   */
  public async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return this.redis.del(...keys);
  }

  /**
   * Check if one or more keys exist
   *
   * @param keys - The keys to check
   * @returns The number of keys that exist
   */
  public async exists(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return this.redis.exists(...keys);
  }

  /**
   * Set a key's time to live in seconds
   *
   * @param key - The key to set expiration on
   * @param seconds - The number of seconds until expiration
   * @returns 1 if the timeout was set, 0 if the key doesn't exist
   */
  public async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  /**
   * Get the time to live for a key in seconds
   *
   * @param key - The key to check
   * @returns The remaining TTL in seconds, -1 if no expiration, -2 if key doesn't exist
   */
  public async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  // ============================================================================
  // Multi-Key Operations
  // ============================================================================

  /**
   * Get the values of multiple keys
   *
   * @param keys - The keys to retrieve
   * @returns An array of values in the same order as the keys
   *
   * @remarks
   * More efficient than multiple GET calls as it uses a single HTTP request.
   */
  public async mget(...keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) {
      return [];
    }
    return this.redis.mget(...keys);
  }

  /**
   * Set multiple keys to multiple values
   *
   * @param data - An object mapping keys to values
   * @returns 'OK' if successful
   *
   * @remarks
   * This is an atomic operation — either all keys are set or none are.
   */
  public async mset(data: Record<string, string>): Promise<'OK'> {
    return this.redis.mset(data);
  }

  // ============================================================================
  // Increment/Decrement Operations
  // ============================================================================

  /**
   * Increment the integer value of a key by 1
   *
   * @param key - The key to increment
   * @returns The value after incrementing
   */
  public async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  /**
   * Increment the integer value of a key by a specific amount
   *
   * @param key - The key to increment
   * @param increment - The amount to increment by
   * @returns The value after incrementing
   */
  public async incrby(key: string, increment: number): Promise<number> {
    return this.redis.incrby(key, increment);
  }

  /**
   * Decrement the integer value of a key by 1
   *
   * @param key - The key to decrement
   * @returns The value after decrementing
   */
  public async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  /**
   * Decrement the integer value of a key by a specific amount
   *
   * @param key - The key to decrement
   * @param decrement - The amount to decrement by
   * @returns The value after decrementing
   */
  public async decrby(key: string, decrement: number): Promise<number> {
    return this.redis.decrby(key, decrement);
  }

  // ============================================================================
  // Sorted Set Operations (for tag TTL tracking)
  // ============================================================================

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
  public async zadd(key: string, score: number, member: string): Promise<number> {
    const result = await this.redis.zadd(key, { score, member });
    return result ?? 0;
  }

  /**
   * Get a range of members from a sorted set by index
   *
   * @param key - The sorted set key
   * @param start - The starting index (0-based)
   * @param stop - The ending index (-1 for last element)
   * @returns An array of members in the specified range
   */
  public async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrange(key, start, stop);
  }

  /**
   * Remove one or more members from a sorted set
   *
   * @param key - The sorted set key
   * @param members - The members to remove
   * @returns The number of members removed
   */
  public async zrem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) {
      return 0;
    }
    return this.redis.zrem(key, ...members);
  }

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
  public async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    return this.redis.zremrangebyscore(key, min, max);
  }

  // ============================================================================
  // Lua Script Execution
  // ============================================================================

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
  public async eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    return this.redis.eval(script, keys, args);
  }

  // ============================================================================
  // Pipeline Operations
  // ============================================================================

  /**
   * Create a pipeline for batching multiple commands
   *
   * @returns A pipeline instance for chaining commands
   *
   * @remarks
   * Pipelines batch multiple commands into a single HTTP request,
   * significantly improving performance.
   */
  public pipeline(): RedisPipeline {
    const pipe = this.redis.pipeline();

    // Create a wrapper that implements our RedisPipeline interface
    const wrapper: RedisPipeline = {
      get: (key: string) => {
        pipe.get(key);
        return wrapper;
      },

      set: (key: string, value: string, options?: SetOptions) => {
        if (options?.ex) {
          pipe.setex(key, options.ex, value);
        } else if (options?.px) {
          pipe.psetex(key, options.px, value);
        } else {
          pipe.set(key, value);
        }
        return wrapper;
      },

      del: (...keys: string[]) => {
        if (keys.length > 0) {
          pipe.del(...keys);
        }
        return wrapper;
      },

      exec: () => pipe.exec(),
    };

    return wrapper;
  }

  // ============================================================================
  // Pub/Sub Operations
  // ============================================================================

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
  public async publish(channel: string, message: string): Promise<number> {
    return this.redis.publish(channel, message);
  }

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
  public subscribe<TMessage = unknown>(channels: string | string[]): RedisSubscriber<TMessage> {
    return this.redis.subscribe<TMessage>(channels) as unknown as RedisSubscriber<TMessage>;
  }

  /**
   * Subscribe to channels matching a glob pattern
   *
   * @param patterns - Glob pattern(s) to match channel names
   * @returns A subscriber instance for listening to messages
   *
   * @remarks
   * Pattern subscriptions use glob-style matching (`*`, `?`, `[abc]`).
   */
  public psubscribe<TMessage = unknown>(patterns: string | string[]): RedisSubscriber<TMessage> {
    return this.redis.psubscribe<TMessage>(patterns) as unknown as RedisSubscriber<TMessage>;
  }

  // ============================================================================
  // Maintenance Operations
  // ============================================================================

  /**
   * Delete all keys in the current database
   *
   * @returns 'OK' if successful
   *
   * @remarks
   * ⚠️ WARNING: This is a destructive operation that cannot be undone.
   */
  public async flushdb(): Promise<'OK'> {
    const result = await this.redis.flushdb();
    return result as 'OK';
  }

  /**
   * Disconnect from Redis
   *
   * @returns A promise that resolves when disconnected
   *
   * @remarks
   * For Upstash HTTP client, this is a no-op since there are no persistent
   * connections. Included for interface compatibility.
   */
  public async disconnect(): Promise<void> {
    // Upstash HTTP client doesn't need explicit disconnect
    return Promise.resolve();
  }
}
