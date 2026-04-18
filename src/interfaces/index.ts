/**
 * @fileoverview Redis Interfaces
 *
 * All Redis-related interfaces for type-safe Redis operations
 * in browser environments using Upstash.
 *
 * - {@link RedisConnection} — Unified connection abstraction
 * - {@link RedisConfig} — Global configuration with named connections
 * - {@link RedisConnector} — Connection factory interface
 * - {@link IRedisService} — Manager contract
 *
 * @module interfaces
 */

// ============================================================================
// Connection Interfaces
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
} from './redis-connection.interface';

// ============================================================================
// Configuration Interfaces
// ============================================================================
export type { RedisConfig, RedisConnectionConfig } from './redis-config.interface';

// ============================================================================
// Connector Interfaces
// ============================================================================
export type { RedisConnector } from './redis-connector.interface';

// ============================================================================
// Service Interfaces
// ============================================================================
export type { IRedisService } from './redis-service.interface';
