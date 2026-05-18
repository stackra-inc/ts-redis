/**
 * Redis Module
 *
 * Configures the RedisManager and its dependencies for DI.
 * Use `RedisModule.forRoot(config)` or `RedisModule.forRootAsync(options)` in your AppModule imports.
 *
 * @module redis.module
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Global, Module, type IDynamicModule } from "@stackra/ts-container";
import { env } from "@stackra/ts-support";

import { REDIS_CONFIG, REDIS_MANAGER, REDIS_CONNECTOR } from "@stackra/contracts";
import { RedisManager } from "@/services/redis-manager.service";
import { UpstashConnector } from "@/connectors/upstash.connector";
import { RedisCacheStore } from "@/stores/redis-cache.store";
import type { RedisModuleOptions } from "@stackra/contracts";
import type { RedisModuleAsyncOptions } from "@stackra/contracts";
import { getRedisConnectionToken } from "@/utils/get-redis-connection-token.util";
import { Logger } from "@stackra/ts-logger";
@Global()
@Module({})
export class RedisModule {
  /**
   * Logger instance scoped to the RedisModule context.
   */
  private static readonly logger = new Logger(RedisModule.name);

  /**
   * Check if Redis credentials are configured.
   *
   * Returns `true` only when both VITE_UPSTASH_REDIS_REST_URL and
   * VITE_UPSTASH_REDIS_REST_TOKEN are set to non-empty values.
   */
  public static hasCredentials(): boolean {
    try {
      const url = String(env<string>("VITE_UPSTASH_REDIS_REST_URL", "") ?? "").trim();
      const token = String(env<string>("VITE_UPSTASH_REDIS_REST_TOKEN", "") ?? "").trim();
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
  public static forRoot(config: RedisModuleOptions): IDynamicModule {
    // Only register if credentials are configured
    if (!this.hasCredentials()) {
      // Console logging is intentional here — DI container not available in static forRoot()
      this.logger.warn(
        "[RedisModule] Skipping registration: VITE_UPSTASH_REDIS_REST_URL and VITE_UPSTASH_REDIS_REST_TOKEN are required",
      );
      return {
        module: RedisModule,
        providers: [],
        exports: [],
      };
    }
    // Build per-connection factory providers so @InjectRedis('name') resolves
    const connectionProviders = Object.keys(config.connections).map((connectionName) => ({
      provide: getRedisConnectionToken(connectionName),
      useFactory: async (manager: RedisManager) => manager.connection(connectionName),
      inject: [RedisManager],
    }));

    // Register the "default" token pointing to the configured default connection
    const defaultConnectionProvider = {
      provide: getRedisConnectionToken(),
      useFactory: async (manager: RedisManager) => manager.connection(),
      inject: [RedisManager],
    };

    const connectionTokens = [
      getRedisConnectionToken(),
      ...Object.keys(config.connections).map(getRedisConnectionToken),
    ];

    return {
      module: RedisModule,
      global: true,
      providers: [
        { provide: REDIS_CONFIG, useValue: config },
        { provide: RedisManager as any, useClass: RedisManager as any },
        { provide: REDIS_MANAGER, useExisting: RedisManager as any },
        { provide: REDIS_CONNECTOR, useClass: UpstashConnector },
        // Register the RedisCacheStore as a DI provider so @CacheStore discovery works
        { provide: RedisCacheStore, useClass: RedisCacheStore },
        defaultConnectionProvider,
        ...connectionProviders,
      ],
      exports: [RedisManager as any, REDIS_MANAGER, RedisCacheStore, ...connectionTokens],
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
  public static forRootAsync(options: RedisModuleAsyncOptions): IDynamicModule {
    // If no factory provided, return empty module
    if (!options.useFactory) {
      // Console logging is intentional here — DI container not available in static forRoot()
      this.logger.warn("[RedisModule] forRootAsync requires useFactory");

      return {
        module: RedisModule,
        providers: [],
        exports: [],
      };
    }

    const configProvider = {
      provide: REDIS_CONFIG,
      useFactory: options.useFactory!,
      inject: options.inject ?? [],
    };

    return {
      module: RedisModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        configProvider,
        { provide: RedisManager as any, useClass: RedisManager as any },
        { provide: REDIS_MANAGER, useExisting: RedisManager as any },
        { provide: REDIS_CONNECTOR, useClass: UpstashConnector },
      ],
      exports: [RedisManager as any, REDIS_MANAGER],
    };
  }
}
