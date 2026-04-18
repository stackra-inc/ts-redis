/**
 * @fileoverview Redis Services
 *
 * Injectable services for managing Redis connections.
 *
 * - {@link RedisManager} — Orchestrates multiple named Redis connections
 *
 * @module services
 */

export { RedisManager } from './redis-manager.service';

/**
 * @deprecated Use `RedisManager` instead. Will be removed in next major version.
 */
export { RedisManager as RedisService } from './redis-manager.service';
