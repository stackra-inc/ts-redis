/**
 * Basic Redis Configuration
 *
 * Single-connection setup for simple applications.
 * Uses Vite environment variables for credentials.
 *
 * Environment Variables:
 * - VITE_UPSTASH_REDIS_REST_URL: Your Upstash Redis REST URL
 * - VITE_UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis REST token
 */

import { defineConfig } from '@stackra/ts-redis';

const redisConfig = defineConfig({
  /**
   * Register globally so all modules can access Redis
   * without explicit imports.
   */
  isGlobal: true,

  /**
   * Default connection name — must match a key in `connections`.
   */
  default: 'main',

  /**
   * Single connection pointing to your Upstash Redis instance.
   */
  connections: {
    main: {
      url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL || '',
      token: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || '',
    },
  },
});

export default redisConfig;
