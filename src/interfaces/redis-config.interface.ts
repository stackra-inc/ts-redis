/**
 * Redis Configuration Interfaces
 *
 * These interfaces define the configuration structure for connecting to
 * Upstash Redis via HTTP REST API. This is browser-compatible and doesn't
 * require Node.js or persistent TCP connections.
 *
 * @module interfaces/redis-config
 */

/**
 * Configuration for a single Upstash Redis connection
 *
 * @remarks
 * Upstash Redis uses HTTP REST API, making it perfect for browser environments.
 * Get your credentials from the Upstash console: https://console.upstash.com
 *
 * @example
 * ```typescript
 * const config: RedisConnectionConfig = {
 *   url: 'https://your-redis.upstash.io',
 *   token: 'your-token-here',
 *   timeout: 5000,
 *   retry: {
 *     retries: 3,
 *     backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 3000)
 *   }
 * };
 * ```
 */
export interface RedisConnectionConfig {
  /**
   * Upstash Redis REST URL
   *
   * @remarks
   * This is the HTTPS endpoint for your Upstash Redis instance.
   * Format: https://[name]-[id].upstash.io
   *
   * Find this in your Upstash console under "REST API" section.
   *
   * @example
   * ```typescript
   * url: "https://my-cache-12345.upstash.io"
   * ```
   */
  url: string;

  /**
   * Upstash Redis REST token
   *
   * @remarks
   * This is your authentication token for the Upstash Redis REST API.
   * Keep this secret and never commit it to version control.
   *
   * Find this in your Upstash console under "REST API" section.
   *
   * @example
   * ```typescript
   * token: import.meta.env.UPSTASH_REDIS_REST_TOKEN!
   * ```
   */
  token: string;

  /**
   * Optional retry configuration
   *
   * @remarks
   * Configure automatic retry behavior for failed requests.
   * Useful for handling transient network errors.
   *
   * @example
   * ```typescript
   * retry: {
   *   retries: 3,
   *   backoff: (retryCount) => {
   *     // Exponential backoff: 100ms, 200ms, 400ms
   *     return Math.min(100 * 2 ** retryCount, 1000);
   *   }
   * }
   * ```
   */
  retry?: {
    /**
     * Maximum number of retry attempts
     * @default 0 (no retries)
     */
    retries?: number;

    /**
     * Function to calculate backoff delay in milliseconds
     *
     * @param retryCount - The current retry attempt (0-indexed)
     * @returns Delay in milliseconds before next retry
     */
    backoff?: (retryCount: number) => number;
  };

  /**
   * Request timeout in milliseconds
   *
   * @remarks
   * Maximum time to wait for a Redis operation to complete.
   * If the operation takes longer, it will be aborted.
   *
   * @default 5000 (5 seconds)
   *
   * @example
   * ```typescript
   * timeout: 10000 // 10 seconds
   * ```
   */
  timeout?: number;

  /**
   * Enable automatic pipelining
   *
   * @remarks
   * When enabled, the client automatically batches commands that are
   * issued within a short time window into a single HTTP request.
   * This can significantly improve performance for multiple operations.
   *
   * @default false
   *
   * @example
   * ```typescript
   * enableAutoPipelining: true
   * ```
   */
  enableAutoPipelining?: boolean;
}

/**
 * Global Redis configuration with multiple named connections
 *
 * @remarks
 * Allows you to configure multiple Redis connections for different purposes
 * (e.g., cache, sessions, rate limiting). Similar to Laravel's multi-connection
 * database configuration.
 *
 * @example
 * ```typescript
 * const config: RedisConfig = {
 *   default: 'cache',
 *   connections: {
 *     cache: {
 *       url: import.meta.env.UPSTASH_CACHE_URL!,
 *       token: import.meta.env.UPSTASH_CACHE_TOKEN!,
 *     },
 *     session: {
 *       url: import.meta.env.UPSTASH_SESSION_URL!,
 *       token: import.meta.env.UPSTASH_SESSION_TOKEN!,
 *       timeout: 10000,
 *     },
 *     ratelimit: {
 *       url: import.meta.env.UPSTASH_RATELIMIT_URL!,
 *       token: import.meta.env.UPSTASH_RATELIMIT_TOKEN!,
 *       enableAutoPipelining: true,
 *     },
 *   },
 * };
 * ```
 */
export interface RedisConfig {
  /**
   * Default connection name
   *
   * @remarks
   * This connection will be used when no specific connection is requested.
   * Must match one of the keys in the connections object.
   *
   * @example
   * ```typescript
   * default: 'cache'
   * ```
   */
  default: string;

  /**
   * Named Redis connections
   *
   * @remarks
   * A map of connection names to their configurations.
   * Each connection can have different settings and point to different
   * Upstash Redis instances.
   *
   * @example
   * ```typescript
   * connections: {
   *   cache: { url: '...', token: '...' },
   *   session: { url: '...', token: '...' },
   * }
   * ```
   */
  connections: Record<string, RedisConnectionConfig>;

  /**
   * Whether to register providers globally.
   *
   * When true, Redis providers are available to all modules without
   * explicit imports. When false, only modules that import RedisModule
   * can access the service.
   *
   * @default true
   */
  isGlobal?: boolean;
}
