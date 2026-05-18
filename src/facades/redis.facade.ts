/**
 * redis — Redis DI proxy
 *
 * Typed proxy for {@link RedisManager} from `@stackra/ts-redis`.
 *
 * Redis connection manager. Manages named Upstash Redis connections.
 *
 * The facade is a module-level constant typed as `RedisManager`.
 * It lazily resolves the service from the DI container on first property
 * access — safe to use at module scope before bootstrap completes.
 *
 * ## Setup (once, in main.tsx)
 *
 * ```typescript
 * import { Application } from '@stackra/ts-container';
 * import { inject } from "@stackra/ts-container";
 *
 * const app = await Application.create(AppModule);
 * Application.create(AppModule); // wires all facades
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { redis } from '@stackra/ts-redis';
 *
 * // Full autocomplete — no .proxy() call needed
 * redis.connection();
 * ```
 *
 * ## Available methods (from {@link RedisManager})
 *
 * - `connection(name?: string): Promise<RedisConnection>`
 * - `extend(driver: string, creator: DriverCreator<RedisConnection>): this`
 * - `getDefaultInstance(): string`
 *
 * ## Testing — swap in a mock
 *
 * ```typescript
 * import { inject } from "@stackra/ts-container";
 * import { RedisManager } from '@/services/redis-manager.service';
 *
 * // Before test — replace the resolved instance
 * inject.swap(RedisManager, mockInstance);
 *
 * // After test — restore
 * inject.clearAll();
 * ```
 *
 * @module facades/redis
 * @see {@link RedisManager} — the underlying service
 * @see {@link inject} — the lazy DI resolution function
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { inject } from "@stackra/ts-container";
import { RedisManager } from "@/services/redis-manager.service";

/**
 * redis — typed proxy for {@link RedisManager}.
 *
 * Resolves `RedisManager` from the DI container via the `RedisManager` token.
 * All property and method access is forwarded to the resolved instance
 * with correct `this` binding.
 *
 * Call `Application.create(AppModule)` once during bootstrap before using this.
 *
 * @example
 * ```typescript
 * redis.connection();
 * ```
 */
export const redis: RedisManager = inject<RedisManager>(RedisManager as any);
