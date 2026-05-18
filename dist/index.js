import { Injectable, Inject, Optional, Global, Module, inject } from '@stackra/ts-container';
import { MultipleInstanceManager, env } from '@stackra/ts-support';
import { REDIS_EVENTS, REDIS_CONFIG, REDIS_CONNECTOR, EVENT_EMITTER, REDIS_MANAGER } from '@stackra/contracts';
import { Logger } from '@stackra/ts-logger';
import { Redis } from '@upstash/redis';
import { CacheStore } from '@stackra/ts-cache';
import { useInject } from '@stackra/ts-container/react';

/**
 * @stackra/ts-redis v1.1.9
 * (c) 2026 [object Object]
 * @license MIT
 */
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate, "_ts_decorate");
function _ts_metadata(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata, "_ts_metadata");
function _ts_param(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
}
__name(_ts_param, "_ts_param");
var RedisManager = class _RedisManager extends MultipleInstanceManager {
  static {
    __name(this, "RedisManager");
  }
  config;
  connector;
  eventEmitter;
  /**
  * Logger instance for Redis manager diagnostics.
  */
  logger = new Logger(_RedisManager.name);
  /**
  * @param config - Redis configuration with named connections
  * @param connector - Connector used to create Redis connections
  * @param eventEmitter - Optional event emitter for dispatching connection
  *   lifecycle events (`redis.connected`, `redis.disconnected`, `redis.error`).
  *   When `EventEmitterModule.forRoot()` is not in the app graph, this is
  *   `undefined` and `emit()` becomes a no-op.
  */
  constructor(config, connector, eventEmitter) {
    super(), this.config = config, this.connector = connector, this.eventEmitter = eventEmitter;
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
  async onModuleInit() {
    if (!this.config || !this.config.default) {
      this.logger.warn("[RedisManager] Config is null or missing default connection, skipping initialization");
      return;
    }
    const defaultName = this.config.default;
    if (this.config.connections[defaultName]) {
      try {
        await this.connection();
      } catch (err) {
        this.logger.warn(`[RedisManager] Failed to warm default connection '${defaultName}': ${err.message}`);
      }
    }
  }
  /**
  * Disconnect all active connections on shutdown.
  *
  * @returns A promise that resolves when all connections are disconnected
  */
  async onModuleDestroy() {
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
  getDefaultInstance() {
    return this.config.default;
  }
  /**
  * Set the default instance name at runtime.
  *
  * @param name - The new default connection name
  */
  setDefaultInstance(name) {
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
  getInstanceConfig(name) {
    const connectionConfig = this.config.connections[name];
    if (!connectionConfig) return void 0;
    return {
      driver: "upstash",
      ...connectionConfig
    };
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
  createDriver(_driver, _config) {
    throw new Error("RedisManager: use connection() for async resolution.");
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
  async createDriverAsync(_driver, config) {
    const connectionName = config.name ?? this.config.default;
    try {
      const conn = await this.connector.connect(config);
      this.emit(REDIS_EVENTS.CONNECTED, {
        connection: connectionName
      });
      return conn;
    } catch (err) {
      this.emit(REDIS_EVENTS.ERROR, {
        connection: connectionName,
        error: err?.message ?? String(err)
      });
      throw err;
    }
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
  async connection(name) {
    return this.instanceAsync(name);
  }
  /**
  * Disconnect a specific connection and remove it from cache.
  *
  * @param name - Connection name. Uses default if omitted.
  * @returns A promise that resolves when the connection is disconnected
  */
  async disconnect(name) {
    const connectionName = name ?? this.config.default;
    if (this.hasInstance(connectionName)) {
      const conn = this.instance(connectionName);
      try {
        await conn.disconnect();
        this.emit(REDIS_EVENTS.DISCONNECTED, {
          connection: connectionName,
          reason: "manual"
        });
      } catch (err) {
        this.emit(REDIS_EVENTS.DISCONNECTED, {
          connection: connectionName,
          reason: err?.message ?? "disconnect-error"
        });
      } finally {
        this.forgetInstance(connectionName);
      }
    }
  }
  /**
  * Disconnect all active connections and clear the cache.
  *
  * @returns A promise that resolves when all connections are disconnected
  */
  async disconnectAll() {
    const names = this.getResolvedInstances();
    await Promise.all(names.map((n) => this.disconnect(n)));
    this.purge();
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Public API — Health Check
  // ─────────────────────────────────────────────────────────────────────────
  /**
  * Perform a health check on a specific connection using ping/echo.
  *
  * Attempts to execute a simple SET/GET cycle to verify the connection
  * is responsive. Returns `true` if the connection is healthy.
  *
  * @param name - Connection name. Uses default if omitted.
  * @returns `true` if the connection responds, `false` otherwise
  */
  async healthCheck(name) {
    try {
      const conn = await this.connection(name);
      const testKey = `__health_check__:${Date.now()}`;
      const result = await conn.set(testKey, "1", {
        ex: 5
      });
      if (result === "OK") {
        await conn.del(testKey);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Public API — Introspection
  // ─────────────────────────────────────────────────────────────────────────
  /**
  * Get all configured connection names (from config).
  *
  * @returns An array of connection names
  */
  getConnectionNames() {
    return Object.keys(this.config.connections);
  }
  /**
  * Get the default connection name.
  *
  * @returns The default connection name from config
  */
  getDefaultConnectionName() {
    return this.config.default;
  }
  /**
  * Check if a connection has been resolved and is currently cached.
  *
  * @param name - Connection name. Uses default if omitted.
  * @returns True if the connection is active, false otherwise
  */
  isConnectionActive(name) {
    return this.hasInstance(name ?? this.config.default);
  }
  /**
  * Get all active (cached) connection names.
  *
  * @returns An array of currently active connection names
  */
  getActiveConnectionNames() {
    return this.getResolvedInstances();
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Public API — Reconnection
  // ─────────────────────────────────────────────────────────────────────────
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
  async reconnect(name, options) {
    const connectionName = name ?? this.config.default;
    const maxRetries = options?.maxRetries ?? 3;
    const baseDelay = options?.delayMs ?? 1e3;
    const multiplier = options?.backoffMultiplier ?? 2;
    if (this.hasInstance(connectionName)) {
      await this.disconnect(connectionName);
    }
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const conn = await this.connection(connectionName);
        this.logger.info(`[RedisManager] Reconnected "${connectionName}" on attempt ${attempt + 1}`);
        return conn;
      } catch (err) {
        lastError = err;
        this.logger.warn(`[RedisManager] Reconnect attempt ${attempt + 1}/${maxRetries} failed for "${connectionName}": ${lastError.message}`);
        this.forgetInstance(connectionName);
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(multiplier, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError ?? new Error(`Failed to reconnect "${connectionName}" after ${maxRetries} attempts`);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────
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
  emit(event, payload) {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, payload);
    } catch (error) {
      this.logger.warn("Failed to emit event", {
        event,
        error
      });
    }
  }
};
RedisManager = _ts_decorate([
  Injectable(),
  _ts_param(0, Inject(REDIS_CONFIG)),
  _ts_param(1, Inject(REDIS_CONNECTOR)),
  _ts_param(2, Optional()),
  _ts_param(2, Inject(EVENT_EMITTER)),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof RedisModuleOptions === "undefined" ? Object : RedisModuleOptions,
    typeof RedisConnector === "undefined" ? Object : RedisConnector,
    typeof IEventEmitter === "undefined" ? Object : IEventEmitter
  ])
], RedisManager);

// src/connections/upstash.connection.ts
var UpstashConnection = class {
  static {
    __name(this, "UpstashConnection");
  }
  redis;
  name;
  /**
  * Create a new Upstash connection
  *
  * @param redis - The Upstash Redis client instance
  * @param name - The unique identifier for this connection
  */
  constructor(redis2, name) {
    this.redis = redis2;
    this.name = name;
  }
  /**
  * Get the connection name
  *
  * @returns The unique identifier for this connection
  */
  getName() {
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
  client() {
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
  async get(key) {
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
  async set(key, value, options) {
    if (options?.ex) {
      const result2 = await this.redis.setex(key, options.ex, value);
      return result2;
    }
    if (options?.px) {
      const result2 = await this.redis.psetex(key, options.px, value);
      return result2;
    }
    if (options?.nx) {
      const result2 = await this.redis.setnx(key, value);
      return result2 ? "OK" : null;
    }
    if (options?.xx) {
      const exists = await this.redis.exists(key);
      if (!exists) {
        return null;
      }
    }
    const result = await this.redis.set(key, value);
    return result;
  }
  /**
  * Delete one or more keys
  *
  * @param keys - The keys to delete
  * @returns The number of keys that were deleted
  */
  async del(...keys) {
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
  async exists(...keys) {
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
  async expire(key, seconds) {
    return this.redis.expire(key, seconds);
  }
  /**
  * Get the time to live for a key in seconds
  *
  * @param key - The key to check
  * @returns The remaining TTL in seconds, -1 if no expiration, -2 if key doesn't exist
  */
  async ttl(key) {
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
  async mget(...keys) {
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
  async mset(data) {
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
  async incr(key) {
    return this.redis.incr(key);
  }
  /**
  * Increment the integer value of a key by a specific amount
  *
  * @param key - The key to increment
  * @param increment - The amount to increment by
  * @returns The value after incrementing
  */
  async incrby(key, increment) {
    return this.redis.incrby(key, increment);
  }
  /**
  * Decrement the integer value of a key by 1
  *
  * @param key - The key to decrement
  * @returns The value after decrementing
  */
  async decr(key) {
    return this.redis.decr(key);
  }
  /**
  * Decrement the integer value of a key by a specific amount
  *
  * @param key - The key to decrement
  * @param decrement - The amount to decrement by
  * @returns The value after decrementing
  */
  async decrby(key, decrement) {
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
  async zadd(key, score, member) {
    const result = await this.redis.zadd(key, {
      score,
      member
    });
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
  async zrange(key, start, stop) {
    return this.redis.zrange(key, start, stop);
  }
  /**
  * Remove one or more members from a sorted set
  *
  * @param key - The sorted set key
  * @param members - The members to remove
  * @returns The number of members removed
  */
  async zrem(key, ...members) {
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
  async zremrangebyscore(key, min, max) {
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
  async eval(script, keys, args) {
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
  pipeline() {
    const pipe = this.redis.pipeline();
    const wrapper = {
      get: /* @__PURE__ */ __name((key) => {
        pipe.get(key);
        return wrapper;
      }, "get"),
      set: /* @__PURE__ */ __name((key, value, options) => {
        if (options?.ex) {
          pipe.setex(key, options.ex, value);
        } else if (options?.px) {
          pipe.psetex(key, options.px, value);
        } else {
          pipe.set(key, value);
        }
        return wrapper;
      }, "set"),
      del: /* @__PURE__ */ __name((...keys) => {
        if (keys.length > 0) {
          pipe.del(...keys);
        }
        return wrapper;
      }, "del"),
      exec: /* @__PURE__ */ __name(() => pipe.exec(), "exec")
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
  async publish(channel, message) {
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
  subscribe(channels) {
    return this.redis.subscribe(channels);
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
  psubscribe(patterns) {
    return this.redis.psubscribe(patterns);
  }
  // ============================================================================
  // Scan Operations
  // ============================================================================
  /**
  * Incrementally iterate over keys matching a pattern
  *
  * @param cursor - The cursor position (use 0 to start)
  * @param options - Scan options (match pattern, count hint)
  * @returns A tuple of [nextCursor, keys]
  */
  async scan(cursor, options) {
    const args = [
      cursor
    ];
    if (options?.match) {
      args.push("MATCH", options.match);
    }
    if (options?.count) {
      args.push("COUNT", options.count);
    }
    const result = await this.redis.scan(cursor, options ?? {});
    return [
      Number(result[0]),
      result[1]
    ];
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
  async flushdb() {
    const result = await this.redis.flushdb();
    return result;
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
  async disconnect() {
    return Promise.resolve();
  }
};

// src/errors/redis.error.ts
var RedisError = class extends Error {
  static {
    __name(this, "RedisError");
  }
  /** Error name for identification. */
  name = "RedisError";
  /** Error code for programmatic handling. */
  code = "REDIS_ERROR";
  /** Optional underlying cause. */
  cause;
  /**
  * Create a new RedisError.
  *
  * @param message - Human-readable error message
  * @param cause   - Optional underlying error that caused this failure
  */
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};

// src/errors/redis-connection.error.ts
var RedisConnectionError = class extends RedisError {
  static {
    __name(this, "RedisConnectionError");
  }
  /** Error name for identification. */
  name = "RedisConnectionError";
  /** Error code for programmatic handling. */
  code = "REDIS_CONNECTION_ERROR";
};

// src/errors/redis-config.error.ts
var RedisModuleOptionsError = class extends RedisError {
  static {
    __name(this, "RedisModuleOptionsError");
  }
  /** Error name for identification. */
  name = "RedisModuleOptionsError";
  /** Error code for programmatic handling. */
  code = "REDIS_CONFIG_ERROR";
};

// src/connectors/upstash.connector.ts
function _ts_decorate2(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate2, "_ts_decorate");
var UpstashConnector = class {
  static {
    __name(this, "UpstashConnector");
  }
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
  async connect(config) {
    if (!config.url) {
      throw new RedisModuleOptionsError("Redis URL is required");
    }
    if (!config.token) {
      throw new RedisModuleOptionsError("Redis token is required");
    }
    const client = new Redis({
      url: config.url,
      token: config.token,
      retry: config.retry,
      enableAutoPipelining: config.enableAutoPipelining
    });
    return new UpstashConnection(client, "upstash");
  }
};
UpstashConnector = _ts_decorate2([
  Injectable()
], UpstashConnector);
function _ts_decorate3(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate3, "_ts_decorate");
function _ts_metadata2(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata2, "_ts_metadata");
function _ts_param2(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
}
__name(_ts_param2, "_ts_param");
var RedisCacheStore = class _RedisCacheStore {
  static {
    __name(this, "RedisCacheStore");
  }
  redisManager;
  config;
  /** Logger scoped to RedisCacheStore context. */
  logger = new Logger(_RedisCacheStore.name);
  /** The resolved Redis connection. Set during `onModuleInit`. */
  connection = null;
  /** Key prefix for all cache entries. */
  prefix;
  /** Default TTL in seconds. */
  defaultTtl;
  constructor(redisManager, config) {
    this.redisManager = redisManager;
    this.config = config;
    this.prefix = config.cacheStore?.prefix ?? "cache:";
    this.defaultTtl = config.cacheStore?.ttl ?? 600;
  }
  /**
  * Resolve the Redis connection on module init.
  */
  async onModuleInit() {
    try {
      const connectionName = this.config.cacheStore?.connection ?? this.config.default;
      this.connection = await this.redisManager.connection(connectionName);
      this.logger.info(`[RedisCacheStore] Connected via "${connectionName}" connection`);
    } catch (error) {
      this.logger.warn(`[RedisCacheStore] Failed to connect: ${error.message}`);
    }
  }
  /**
  * Get the active connection or throw if not initialized.
  */
  getConnection() {
    if (!this.connection) {
      throw new Error("[RedisCacheStore] Not initialized \u2014 connection not available.");
    }
    return this.connection;
  }
  // ══════════════════════════════════════════════════════════════════════════
  // IStore Implementation
  // ══════════════════════════════════════════════════════════════════════════
  /** @inheritdoc */
  async get(key) {
    const conn = this.getConnection();
    const raw = await conn.get(this.prefix + key);
    if (raw === null) return void 0;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  /** @inheritdoc */
  async many(keys) {
    if (keys.length === 0) return {};
    const conn = this.getConnection();
    const prefixedKeys = keys.map((k) => this.prefix + k);
    const values = await conn.mget(...prefixedKeys);
    const results = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const raw = values[i];
      if (raw === null || raw === void 0) {
        results[key] = void 0;
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
  async put(key, value, seconds) {
    const conn = this.getConnection();
    const serialized = JSON.stringify(value);
    const ttl = seconds > 0 ? seconds : this.defaultTtl;
    const result = await conn.set(this.prefix + key, serialized, {
      ex: ttl
    });
    return result === "OK";
  }
  /** @inheritdoc */
  async putMany(values, seconds) {
    const conn = this.getConnection();
    const ttl = seconds > 0 ? seconds : this.defaultTtl;
    const pipe = conn.pipeline();
    for (const [key, value] of Object.entries(values)) {
      const serialized = JSON.stringify(value);
      pipe.set(this.prefix + key, serialized, {
        ex: ttl
      });
    }
    await pipe.exec();
    return true;
  }
  /** @inheritdoc */
  async forever(key, value) {
    const conn = this.getConnection();
    const serialized = JSON.stringify(value);
    const result = await conn.set(this.prefix + key, serialized);
    return result === "OK";
  }
  /** @inheritdoc */
  async increment(key, value = 1) {
    const conn = this.getConnection();
    return conn.incrby(this.prefix + key, value);
  }
  /** @inheritdoc */
  async decrement(key, value = 1) {
    const conn = this.getConnection();
    return conn.decrby(this.prefix + key, value);
  }
  /** @inheritdoc */
  async forget(key) {
    const conn = this.getConnection();
    const deleted = await conn.del(this.prefix + key);
    return deleted > 0;
  }
  /** @inheritdoc */
  async flush() {
    const conn = this.getConnection();
    let cursor = 0;
    do {
      const [nextCursor, keys] = await conn.scan(cursor, {
        match: `${this.prefix}*`,
        count: 100
      });
      cursor = nextCursor;
      if (keys.length > 0) {
        await conn.del(...keys);
      }
    } while (cursor !== 0);
    return true;
  }
  /** @inheritdoc */
  getPrefix() {
    return this.prefix;
  }
};
RedisCacheStore = _ts_decorate3([
  CacheStore({
    name: "redis",
    driver: "redis",
    config: {
      prefix: "cache:",
      ttl: 600
    }
  }),
  Injectable(),
  _ts_param2(1, Inject(REDIS_CONFIG)),
  _ts_metadata2("design:type", Function),
  _ts_metadata2("design:paramtypes", [
    typeof RedisManager === "undefined" ? Object : RedisManager,
    typeof RedisModuleOptions === "undefined" ? Object : RedisModuleOptions
  ])
], RedisCacheStore);

// src/utils/get-redis-connection-token.util.ts
var getRedisConnectionToken = /* @__PURE__ */ __name((connectionName = "default") => `RedisConnection:${connectionName}`, "getRedisConnectionToken");
function _ts_decorate4(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate4, "_ts_decorate");
var RedisModule = class _RedisModule {
  static {
    __name(this, "RedisModule");
  }
  /**
  * Logger instance scoped to the RedisModule context.
  */
  static logger = new Logger(_RedisModule.name);
  /**
  * Check if Redis credentials are configured.
  *
  * Returns `true` only when both VITE_UPSTASH_REDIS_REST_URL and
  * VITE_UPSTASH_REDIS_REST_TOKEN are set to non-empty values.
  */
  static hasCredentials() {
    try {
      const url = String(env("VITE_UPSTASH_REDIS_REST_URL", "") ?? "").trim();
      const token = String(env("VITE_UPSTASH_REDIS_REST_TOKEN", "") ?? "").trim();
      return url.length > 0 && token.length > 0;
    } catch {
      return false;
    }
  }
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
  static forRoot(config) {
    if (!this.hasCredentials()) {
      this.logger.warn("[RedisModule] Skipping registration: VITE_UPSTASH_REDIS_REST_URL and VITE_UPSTASH_REDIS_REST_TOKEN are required");
      return {
        module: _RedisModule,
        providers: [],
        exports: []
      };
    }
    const connectionProviders = Object.keys(config.connections).map((connectionName) => ({
      provide: getRedisConnectionToken(connectionName),
      useFactory: /* @__PURE__ */ __name(async (manager) => manager.connection(connectionName), "useFactory"),
      inject: [
        RedisManager
      ]
    }));
    const defaultConnectionProvider = {
      provide: getRedisConnectionToken(),
      useFactory: /* @__PURE__ */ __name(async (manager) => manager.connection(), "useFactory"),
      inject: [
        RedisManager
      ]
    };
    const connectionTokens = [
      getRedisConnectionToken(),
      ...Object.keys(config.connections).map(getRedisConnectionToken)
    ];
    return {
      module: _RedisModule,
      global: true,
      providers: [
        {
          provide: REDIS_CONFIG,
          useValue: config
        },
        {
          provide: RedisManager,
          useClass: RedisManager
        },
        {
          provide: REDIS_MANAGER,
          useExisting: RedisManager
        },
        {
          provide: REDIS_CONNECTOR,
          useClass: UpstashConnector
        },
        // Register the RedisCacheStore as a DI provider so @CacheStore discovery works
        {
          provide: RedisCacheStore,
          useClass: RedisCacheStore
        },
        defaultConnectionProvider,
        ...connectionProviders
      ],
      exports: [
        RedisManager,
        REDIS_MANAGER,
        RedisCacheStore,
        ...connectionTokens
      ]
    };
  }
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
  static forRootAsync(options) {
    if (!options.useFactory) {
      this.logger.warn("[RedisModule] forRootAsync requires useFactory");
      return {
        module: _RedisModule,
        providers: [],
        exports: []
      };
    }
    const configProvider = {
      provide: REDIS_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject ?? []
    };
    return {
      module: _RedisModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        configProvider,
        {
          provide: RedisManager,
          useClass: RedisManager
        },
        {
          provide: REDIS_MANAGER,
          useExisting: RedisManager
        },
        {
          provide: REDIS_CONNECTOR,
          useClass: UpstashConnector
        }
      ],
      exports: [
        RedisManager,
        REDIS_MANAGER
      ]
    };
  }
};
RedisModule = _ts_decorate4([
  Global(),
  Module({})
], RedisModule);

// src/stores/redis.store.ts
var RedisStore = class {
  static {
    __name(this, "RedisStore");
  }
  /** The Redis connection used for all operations. */
  connection;
  /** Key prefix applied to all cache keys. */
  prefix;
  /** Default TTL in seconds. */
  defaultTtl;
  /**
  * Create a new RedisStore.
  *
  * @param options - Store configuration with connection, prefix, and TTL
  */
  constructor(options) {
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
  async get(key) {
    const raw = await this.connection.get(this.prefix + key);
    if (raw === null) return void 0;
    try {
      return JSON.parse(raw);
    } catch {
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
  async many(keys) {
    if (keys.length === 0) return {};
    const prefixedKeys = keys.map((k) => this.prefix + k);
    const values = await this.connection.mget(...prefixedKeys);
    const results = {};
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const raw = values[i];
      if (raw === null || raw === void 0) {
        results[key] = void 0;
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
  async put(key, value, seconds) {
    const serialized = JSON.stringify(value);
    const ttl = seconds > 0 ? seconds : this.defaultTtl;
    const result = await this.connection.set(this.prefix + key, serialized, {
      ex: ttl
    });
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
  async putMany(values, seconds) {
    const ttl = seconds > 0 ? seconds : this.defaultTtl;
    const pipe = this.connection.pipeline();
    for (const [key, value] of Object.entries(values)) {
      const serialized = JSON.stringify(value);
      pipe.set(this.prefix + key, serialized, {
        ex: ttl
      });
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
  async forever(key, value) {
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
  async increment(key, value = 1) {
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
  async decrement(key, value = 1) {
    return this.connection.decrby(this.prefix + key, value);
  }
  /**
  * Remove a single item from Redis.
  *
  * @param key - The cache key to remove
  * @returns `true` if the key was deleted, `false` if it didn't exist
  */
  async forget(key) {
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
  async flush() {
    let cursor = 0;
    do {
      const [nextCursor, keys] = await this.connection.scan(cursor, {
        match: `${this.prefix}*`,
        count: 100
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
  getPrefix() {
    return this.prefix;
  }
};
var InjectRedis = /* @__PURE__ */ __name((connectionName) => Inject(getRedisConnectionToken(connectionName)), "InjectRedis");
var InjectRedisManager = /* @__PURE__ */ __name(() => Inject(REDIS_MANAGER), "InjectRedisManager");
function useRedis() {
  return useInject(RedisManager);
}
__name(useRedis, "useRedis");
function useRedisConnection(name) {
  const redis2 = useInject(RedisManager);
  return redis2.connection(name);
}
__name(useRedisConnection, "useRedisConnection");

// src/utils/define-config.util.ts
function defineConfig(config) {
  return config;
}
__name(defineConfig, "defineConfig");
var redis = inject(RedisManager);

export { InjectRedis, InjectRedisManager, RedisConnectionError, RedisError, RedisManager, RedisModule, RedisModuleOptionsError, RedisStore, UpstashConnection, UpstashConnector, defineConfig, getRedisConnectionToken, redis, useRedis, useRedisConnection };
