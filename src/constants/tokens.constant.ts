/**
 * Dependency Injection Tokens
 *
 * Symbol-based tokens for injecting Redis services and configuration
 * via the DI container.
 *
 * @module constants/tokens
 */

/**
 * Injection token for Redis configuration.
 *
 * Used to inject the Redis configuration object into services.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class RedisManager {
 *   constructor(@Inject(REDIS_CONFIG) private config: RedisConfig) {}
 * }
 * ```
 */
export const REDIS_CONFIG = Symbol.for('REDIS_CONFIG');

/**
 * Injection token for Redis connector.
 *
 * Used to inject the connector that creates Redis connections.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class RedisManager {
 *   constructor(@Inject(REDIS_CONNECTOR) private connector: RedisConnector) {}
 * }
 * ```
 */
export const REDIS_CONNECTOR = Symbol.for('REDIS_CONNECTOR');

/**
 * Injection token for RedisManager (alternative to class-based injection).
 *
 * Allows injecting the RedisManager via a Symbol token instead of the
 * class reference. Both approaches resolve to the same instance.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class CacheService {
 *   constructor(@Inject(REDIS_MANAGER) private redis: RedisManager) {}
 * }
 * ```
 */
export const REDIS_MANAGER = Symbol.for('REDIS_MANAGER');

/**
 * @deprecated Use {@link REDIS_MANAGER} instead.
 */
export const REDIS_SERVICE = REDIS_MANAGER;
