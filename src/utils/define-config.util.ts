/**
 * Define Config Utility
 *
 * Helper function to define Redis configuration with type safety.
 *
 * @module @stackra/ts-redis
 */

import type { RedisConfig } from '@/interfaces';

/**
 * Helper function to define Redis configuration with type safety
 *
 * Provides IDE autocomplete and type checking for configuration objects.
 * This pattern is consistent with modern tooling (Vite, Vitest, etc.).
 *
 * @param config - The Redis configuration object
 * @returns The same configuration object with proper typing
 *
 * @example
 * ```typescript
 * // redis.config.ts
 * import { defineConfig } from '@stackra/ts-redis';
 *
 * export default defineConfig({
 *   default: 'main',
 *   connections: {
 *     main: {
 *       url: import.meta.env.VITE_REDIS_URL,
 *       token: import.meta.env.VITE_REDIS_TOKEN,
 *     },
 *     cache: {
 *       url: import.meta.env.VITE_REDIS_CACHE_URL,
 *       token: import.meta.env.VITE_REDIS_CACHE_TOKEN,
 *     },
 *   },
 * });
 * ```
 */
export function defineConfig(config: RedisConfig): RedisConfig {
  return config;
}
