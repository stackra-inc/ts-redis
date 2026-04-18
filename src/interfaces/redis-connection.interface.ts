/**
 * Redis Connection Interface
 *
 * Provides a unified abstraction over the Upstash Redis HTTP client,
 * enabling browser-compatible Redis operations without requiring Node.js
 * or persistent TCP connections.
 *
 * This interface is designed for client-side use with Upstash Redis REST API.
 * All operations are HTTP-based and work seamlessly in browser environments.
 *
 * @module interfaces/redis-connection
 *
 * @example
 * ```typescript
 * const connection = await redisManager.connection('cache');
 *
 * // Basic operations
 * await connection.set('user:123', JSON.stringify(user), { ex: 3600 });
 * const data = await connection.get('user:123');
 *
 * // Multi-key operations
 * const users = await connection.mget('user:1', 'user:2', 'user:3');
 *
 * // Increment counters
 * await connection.incr('page:views');
 * ```
 */
export interface RedisConnection {
  /**
   * Get the connection name
   *
   * @returns The unique identifier for this connection
   *
   * @example
   * ```typescript
   * const name = connection.getName(); // 'cache'
   * ```
   */
  getName(): string;

  /**
   * Get the underlying Upstash Redis client
   *
   * @returns The raw Upstash Redis instance for advanced operations
   *
   * @remarks
   * Use this when you need direct access to Upstash-specific features
   * not exposed through this interface.
   *
   * @example
   * ```typescript
   * const upstashClient = connection.client();
   * await upstashClient.hset('user:123', { name: 'John', age: 30 });
   * ```
   */
  client(): unknown;

  // ============================================================================
  // Basic Key-Value Operations
  // ============================================================================

  /**
   * Get the value of a key
   *
   * @param key - The key to retrieve
   * @returns The value stored at the key, or null if the key doesn't exist
   *
   * @example
   * ```typescript
   * const value = await connection.get('user:123');
   * if (value) {
   *   const user = JSON.parse(value);
   * }
   * ```
   */
  get(key: string): Promise<string | null>;

  /**
   * Set the value of a key with optional expiration
   *
   * @param key - The key to set
   * @param value - The value to store (must be a string)
   * @param options - Optional settings for expiration and conditional setting
   * @returns 'OK' if successful, null if the operation failed (e.g., NX condition not met)
   *
   * @example
   * ```typescript
   * // Set with 1 hour expiration
   * await connection.set('session:abc', sessionData, { ex: 3600 });
   *
   * // Set only if key doesn't exist
   * const created = await connection.set('lock:resource', 'locked', { nx: true });
   *
   * // Set with millisecond precision
   * await connection.set('temp:data', value, { px: 5000 });
   * ```
   */
  set(key: string, value: string, options?: SetOptions): Promise<'OK' | null>;

  /**
   * Delete one or more keys
   *
   * @param keys - The keys to delete
   * @returns The number of keys that were deleted
   *
   * @example
   * ```typescript
   * const deleted = await connection.del('user:123', 'user:456');
   * console.log(`Deleted ${deleted} keys`);
   * ```
   */
  del(...keys: string[]): Promise<number>;

  /**
   * Check if one or more keys exist
   *
   * @param keys - The keys to check
   * @returns The number of keys that exist
   *
   * @example
   * ```typescript
   * const count = await connection.exists('user:123', 'user:456');
   * if (count === 2) {
   *   console.log('Both users exist');
   * }
   * ```
   */
  exists(...keys: string[]): Promise<number>;

  /**
   * Set a key's time to live in seconds
   *
   * @param key - The key to set expiration on
   * @param seconds - The number of seconds until expiration
   * @returns 1 if the timeout was set, 0 if the key doesn't exist
   *
   * @example
   * ```typescript
   * await connection.set('temp:data', value);
   * await connection.expire('temp:data', 300); // Expire in 5 minutes
   * ```
   */
  expire(key: string, seconds: number): Promise<number>;

  /**
   * Get the time to live for a key in seconds
   *
   * @param key - The key to check
   * @returns The remaining time to live in seconds, -1 if no expiration, -2 if key doesn't exist
   *
   * @example
   * ```typescript
   * const ttl = await connection.ttl('session:abc');
   * if (ttl > 0) {
   *   console.log(`Session expires in ${ttl} seconds`);
   * }
   * ```
   */
  ttl(key: string): Promise<number>;

  // ============================================================================
  // Multi-Key Operations
  // ============================================================================

  /**
   * Get the values of multiple keys
   *
   * @param keys - The keys to retrieve
   * @returns An array of values in the same order as the keys (null for non-existent keys)
   *
   * @remarks
   * This is more efficient than multiple GET calls as it uses a single HTTP request.
   *
   * @example
   * ```typescript
   * const [user1, user2, user3] = await connection.mget(
   *   'user:1',
   *   'user:2',
   *   'user:3'
   * );
   * ```
   */
  mget(...keys: string[]): Promise<(string | null)[]>;

  /**
   * Set multiple keys to multiple values
   *
   * @param data - An object mapping keys to values
   * @returns 'OK' if successful
   *
   * @remarks
   * This is an atomic operation - either all keys are set or none are.
   * More efficient than multiple SET calls.
   *
   * @example
   * ```typescript
   * await connection.mset({
   *   'user:1': JSON.stringify(user1),
   *   'user:2': JSON.stringify(user2),
   *   'user:3': JSON.stringify(user3),
   * });
   * ```
   */
  mset(data: Record<string, string>): Promise<'OK'>;

  // ============================================================================
  // Increment/Decrement Operations
  // ============================================================================

  /**
   * Increment the integer value of a key by 1
   *
   * @param key - The key to increment
   * @returns The value after incrementing
   *
   * @remarks
   * If the key doesn't exist, it's set to 0 before incrementing.
   * If the value is not an integer, an error is thrown.
   *
   * @example
   * ```typescript
   * const views = await connection.incr('page:views');
   * console.log(`Page has ${views} views`);
   * ```
   */
  incr(key: string): Promise<number>;

  /**
   * Increment the integer value of a key by a specific amount
   *
   * @param key - The key to increment
   * @param increment - The amount to increment by
   * @returns The value after incrementing
   *
   * @example
   * ```typescript
   * await connection.incrby('user:123:points', 50);
   * ```
   */
  incrby(key: string, increment: number): Promise<number>;

  /**
   * Decrement the integer value of a key by 1
   *
   * @param key - The key to decrement
   * @returns The value after decrementing
   *
   * @example
   * ```typescript
   * const remaining = await connection.decr('rate:limit:123');
   * ```
   */
  decr(key: string): Promise<number>;

  /**
   * Decrement the integer value of a key by a specific amount
   *
   * @param key - The key to decrement
   * @param decrement - The amount to decrement by
   * @returns The value after decrementing
   *
   * @example
   * ```typescript
   * await connection.decrby('inventory:item:123', 5);
   * ```
   */
  decrby(key: string, decrement: number): Promise<number>;

  // ============================================================================
  // Sorted Set Operations (for tag TTL tracking)
  // ============================================================================

  /**
   * Add a member to a sorted set with a score
   *
   * @param key - The sorted set key
   * @param score - The score for the member (typically a timestamp)
   * @param member - The member to add
   * @returns The number of elements added (0 if member already existed and score was updated)
   *
   * @remarks
   * Used internally for cache tag TTL tracking. The score is typically
   * a Unix timestamp representing when a cached item expires.
   *
   * @example
   * ```typescript
   * // Track when a cached item expires
   * const expiresAt = Date.now() + 3600000; // 1 hour from now
   * await connection.zadd('tag:users:ttl', expiresAt, 'user:123');
   * ```
   */
  zadd(key: string, score: number, member: string): Promise<number>;

  /**
   * Get a range of members from a sorted set by index
   *
   * @param key - The sorted set key
   * @param start - The starting index (0-based)
   * @param stop - The ending index (-1 for last element)
   * @returns An array of members in the specified range
   *
   * @example
   * ```typescript
   * // Get all members
   * const members = await connection.zrange('tag:users:ttl', 0, -1);
   * ```
   */
  zrange(key: string, start: number, stop: number): Promise<string[]>;

  /**
   * Remove one or more members from a sorted set
   *
   * @param key - The sorted set key
   * @param members - The members to remove
   * @returns The number of members removed
   *
   * @example
   * ```typescript
   * await connection.zrem('tag:users:ttl', 'user:123', 'user:456');
   * ```
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
   * Used for cleaning up expired cache entries. Pass the current timestamp
   * as max to remove all entries that have expired.
   *
   * @example
   * ```typescript
   * // Remove all expired entries
   * const now = Date.now();
   * const removed = await connection.zremrangebyscore('tag:users:ttl', 0, now);
   * console.log(`Cleaned up ${removed} expired entries`);
   * ```
   */
  zremrangebyscore(key: string, min: number, max: number): Promise<number>;

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
   * Lua scripts execute atomically on the Redis server, making them ideal
   * for complex operations that need to be atomic. Used internally for
   * cache tag operations.
   *
   * @example
   * ```typescript
   * const script = `
   *   local value = redis.call('GET', KEYS[1])
   *   if value then
   *     return redis.call('INCR', KEYS[1])
   *   else
   *     return redis.call('SET', KEYS[1], ARGV[1])
   *   end
   * `;
   * const result = await connection.eval(script, ['counter'], ['1']);
   * ```
   */
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;

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
   * significantly improving performance when executing multiple operations.
   * All commands are executed atomically on the server.
   *
   * @example
   * ```typescript
   * const results = await connection.pipeline()
   *   .set('key1', 'value1')
   *   .set('key2', 'value2')
   *   .get('key1')
   *   .del('key3')
   *   .exec();
   *
   * console.log(results); // ['OK', 'OK', 'value1', 1]
   * ```
   */
  pipeline(): RedisPipeline;

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
   * Publishing is a fire-and-forget HTTP call that works in all environments
   * (browser, serverless, edge). Subscribers on other connections or services
   * will receive the message.
   *
   * @example
   * ```typescript
   * // Notify subscribers of a cache invalidation
   * await connection.publish('cache:invalidate', 'user:123');
   *
   * // Broadcast an event
   * const receivers = await connection.publish('events:order', JSON.stringify({
   *   type: 'created',
   *   orderId: 'abc-123',
   * }));
   * console.log(`${receivers} subscriber(s) received the message`);
   * ```
   */
  publish(channel: string, message: string): Promise<number>;

  /**
   * Subscribe to one or more channels
   *
   * @param channels - Channel name(s) to subscribe to
   * @returns A subscriber instance for listening to messages
   *
   * @remarks
   * Uses HTTP streaming under the hood. The subscriber emits events
   * when messages arrive on the subscribed channels.
   *
   * @example
   * ```typescript
   * const subscriber = connection.subscribe<string>('notifications');
   *
   * subscriber.on('message', (data) => {
   *   console.log(`Channel: ${data.channel}, Message: ${data.message}`);
   * });
   *
   * // Unsubscribe when done
   * await subscriber.unsubscribe();
   * ```
   */
  subscribe<TMessage = unknown>(channels: string | string[]): RedisSubscriber<TMessage>;

  /**
   * Subscribe to channels matching a glob pattern
   *
   * @param patterns - Glob pattern(s) to match channel names
   * @returns A subscriber instance for listening to messages
   *
   * @remarks
   * Pattern subscriptions use glob-style matching:
   * - `*` matches any sequence of characters
   * - `?` matches a single character
   * - `[abc]` matches any character in the set
   *
   * @example
   * ```typescript
   * const subscriber = connection.psubscribe<string>('user:*');
   *
   * subscriber.on('pmessage', (data) => {
   *   console.log(`Pattern: ${data.pattern}, Channel: ${data.channel}`);
   *   console.log(`Message: ${data.message}`);
   * });
   *
   * // Unsubscribe when done
   * await subscriber.unsubscribe();
   * ```
   */
  psubscribe<TMessage = unknown>(patterns: string | string[]): RedisSubscriber<TMessage>;

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
   * Use with extreme caution, typically only in development/testing.
   *
   * @example
   * ```typescript
   * if (import.meta.env.NODE_ENV === 'test') {
   *   await connection.flushdb();
   * }
   * ```
   */
  flushdb(): Promise<'OK'>;

  /**
   * Disconnect from Redis
   *
   * @remarks
   * For Upstash HTTP client, this is a no-op since there are no persistent
   * connections. Included for interface compatibility.
   *
   * @example
   * ```typescript
   * await connection.disconnect();
   * ```
   */
  disconnect(): Promise<void>;
}

/**
 * Pipeline interface for batching Redis commands
 *
 * @remarks
 * Pipelines improve performance by sending multiple commands in a single
 * HTTP request. Commands are queued and executed atomically when exec() is called.
 *
 * @example
 * ```typescript
 * const pipeline = connection.pipeline();
 * pipeline
 *   .set('user:1', userData1)
 *   .set('user:2', userData2)
 *   .expire('user:1', 3600)
 *   .expire('user:2', 3600);
 *
 * const results = await pipeline.exec();
 * ```
 */
export interface RedisPipeline {
  /**
   * Queue a GET command
   *
   * @param key - The key to retrieve
   * @returns The pipeline instance for chaining
   */
  get(key: string): this;

  /**
   * Queue a SET command
   *
   * @param key - The key to set
   * @param value - The value to store
   * @param options - Optional expiration settings
   * @returns The pipeline instance for chaining
   */
  set(key: string, value: string, options?: SetOptions): this;

  /**
   * Queue a DEL command
   *
   * @param keys - The keys to delete
   * @returns The pipeline instance for chaining
   */
  del(...keys: string[]): this;

  /**
   * Execute all queued commands
   *
   * @returns An array of results, one for each queued command
   *
   * @remarks
   * The results array corresponds to the order of queued commands.
   * If a command fails, its result will be an error object.
   */
  exec(): Promise<unknown[]>;
}

/**
 * Options for SET command
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
 * // Expire in 5 seconds (millisecond precision)
 * const opts2: SetOptions = { px: 5000 };
 *
 * // Set only if key doesn't exist
 * const opts3: SetOptions = { nx: true };
 *
 * // Set only if key exists
 * const opts4: SetOptions = { xx: true };
 * ```
 */
export interface SetOptions {
  /**
   * Set the expiration time in seconds
   *
   * @remarks
   * Cannot be used together with px option.
   */
  ex?: number;

  /**
   * Set the expiration time in milliseconds
   *
   * @remarks
   * Cannot be used together with ex option.
   * Provides millisecond precision for short-lived cache entries.
   */
  px?: number;

  /**
   * Only set the key if it does not already exist
   *
   * @remarks
   * Useful for implementing distributed locks or ensuring
   * a value is only set once.
   */
  nx?: boolean;

  /**
   * Only set the key if it already exists
   *
   * @remarks
   * Useful for updating existing values without creating new ones.
   */
  xx?: boolean;
}

// ============================================================================
// Pub/Sub Types
// ============================================================================

/**
 * Data emitted for a direct channel message event
 *
 * @example
 * ```typescript
 * subscriber.on('message', (data: RedisMessageData<string>) => {
 *   console.log(data.channel, data.message);
 * });
 * ```
 */
export interface RedisMessageData<TMessage = unknown> {
  /** The channel the message was published to */
  channel: string;
  /** The message payload */
  message: TMessage;
}

/**
 * Data emitted for a pattern-matched message event
 *
 * @example
 * ```typescript
 * subscriber.on('pmessage', (data: RedisPatternMessageData<string>) => {
 *   console.log(data.pattern, data.channel, data.message);
 * });
 * ```
 */
export interface RedisPatternMessageData<TMessage = unknown> {
  /** The pattern that matched the channel */
  pattern: string;
  /** The actual channel the message was published to */
  channel: string;
  /** The message payload */
  message: TMessage;
}

/**
 * Data emitted for subscription count events (subscribe, unsubscribe, etc.)
 */
export interface RedisSubscriptionCountEvent {
  /** The channel or pattern */
  channel: string;
  /** The current number of active subscriptions */
  count: number;
}

/**
 * Map of event types to their data shapes for a Redis subscriber
 */
export interface RedisSubscriberEventMap<TMessage = unknown> {
  /** Fired when a message is received on a directly subscribed channel */
  message: RedisMessageData<TMessage>;
  /** Fired when a message matches a pattern subscription */
  pmessage: RedisPatternMessageData<TMessage>;
  /** Fired when a channel subscription is confirmed */
  subscribe: RedisSubscriptionCountEvent;
  /** Fired when a channel is unsubscribed */
  unsubscribe: RedisSubscriptionCountEvent;
  /** Fired when a pattern subscription is confirmed */
  psubscribe: RedisSubscriptionCountEvent;
  /** Fired when a pattern is unsubscribed */
  punsubscribe: RedisSubscriptionCountEvent;
  /** Fired when an error occurs */
  error: Error;
}

/**
 * Redis subscriber for receiving pub/sub messages
 *
 * @remarks
 * Subscribers use HTTP streaming to listen for messages published
 * to channels or patterns. They emit typed events that can be
 * listened to via the `on` method.
 *
 * Always call `unsubscribe()` when done to clean up resources.
 *
 * @example
 * ```typescript
 * const subscriber = connection.subscribe<string>('chat:room:1');
 *
 * subscriber.on('message', (data) => {
 *   console.log(`[${data.channel}] ${data.message}`);
 * });
 *
 * // Later...
 * await subscriber.unsubscribe();
 * ```
 */
export interface RedisSubscriber<TMessage = unknown> {
  /**
   * Register an event listener
   *
   * @param type - The event type to listen for
   * @param listener - Callback invoked when the event fires
   */
  on<T extends keyof RedisSubscriberEventMap<TMessage>>(
    type: T,
    listener: (event: RedisSubscriberEventMap<TMessage>[T]) => void
  ): void;

  /**
   * Remove all registered event listeners
   */
  removeAllListeners(): void;

  /**
   * Unsubscribe from some or all channels/patterns
   *
   * @param channels - Specific channels to unsubscribe from. If omitted, unsubscribes from all.
   */
  unsubscribe(channels?: string[]): Promise<void>;

  /**
   * Get the list of currently subscribed channels or patterns
   *
   * @returns Array of channel/pattern names
   */
  getSubscribedChannels(): string[];
}
