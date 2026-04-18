/**
 * Redis Module
 *
 * Configures the RedisManager and its dependencies for DI.
 * Use `RedisModule.forRoot(config)` in your AppModule imports.
 *
 * @module redis.module
 */

import { Module, type DynamicModule } from '@stackra/ts-container';

import { REDIS_CONFIG, REDIS_MANAGER, REDIS_CONNECTOR } from '@/constants/tokens.constant';
import { RedisManager } from '@/services/redis-manager.service';
import { UpstashConnector } from '@/connectors/upstash.connector';
import type { RedisConfig } from '@/interfaces/redis-config.interface';

@Module({})
export class RedisModule {
  /**
   * Configure the Redis module with runtime configuration.
   *
   * @param config - Redis configuration with named connections
   * @returns DynamicModule with all Redis providers
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
  public static forRoot(config: RedisConfig): DynamicModule {
    return {
      module: RedisModule,
      global: config.isGlobal ?? true,
      providers: [
        { provide: REDIS_CONFIG, useValue: config },
        { provide: RedisManager, useClass: RedisManager },
        { provide: REDIS_MANAGER, useExisting: RedisManager },
        { provide: REDIS_CONNECTOR, useClass: UpstashConnector },
      ],
      exports: [RedisManager, REDIS_MANAGER],
    };
  }
}
