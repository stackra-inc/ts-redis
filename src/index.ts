/**
 * @stackra/ts-redis
 *
 * Client-side Redis connection management using Upstash HTTP API.
 * Provides multiple named connections, DI integration, and React hooks.
 *
 * @module @stackra/ts-redis
 */

// ============================================================================
// Module
// ============================================================================
export { RedisModule } from './redis.module';

// ============================================================================
// Services
// ============================================================================
export { RedisManager } from './services/redis-manager.service';

/**
 * @deprecated Use `RedisManager` instead.
 */
export { RedisManager as RedisService } from './services/redis-manager.service';

// ============================================================================
// Connections
// ============================================================================
export { UpstashConnection } from './connections/upstash.connection';

// ============================================================================
// Connectors
// ============================================================================
export { UpstashConnector } from './connectors/upstash.connector';

// ============================================================================
// Interfaces
// ============================================================================
export type {
  RedisConnection,
  RedisPipeline,
  SetOptions,
  RedisSubscriber,
  RedisSubscriberEventMap,
  RedisMessageData,
  RedisPatternMessageData,
  RedisSubscriptionCountEvent,
} from './interfaces/redis-connection.interface';

export type { RedisConfig, RedisConnectionConfig } from './interfaces/redis-config.interface';

export type { RedisConnector } from './interfaces/redis-connector.interface';
export type { IRedisService } from './interfaces/redis-service.interface';

// ============================================================================
// Constants/Tokens
// ============================================================================
export { REDIS_CONFIG, REDIS_CONNECTOR, REDIS_MANAGER } from './constants/tokens.constant';

// ============================================================================
// React Hooks
// ============================================================================
export { useRedis } from './hooks/use-redis';
export { useRedisConnection } from './hooks/use-redis-connection';

// ============================================================================
// Utils
// ============================================================================
export { defineConfig } from './utils';

// ============================================================================
// Facades
// ============================================================================
export { RedisFacade } from './facades';
