/**
 * Redis Facade
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
 * import { Facade } from '@stackra/ts-support';
 *
 * const app = await Application.create(AppModule);
 * Facade.setApplication(app); // wires all facades
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { RedisFacade } from '@stackra/ts-redis';
 *
 * // Full autocomplete — no .proxy() call needed
 * RedisFacade.connection();
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
 * import { Facade } from '@stackra/ts-support';
 * import { RedisManager } from '@/services/redis-manager.service';
 *
 * // Before test — replace the resolved instance
 * Facade.swap(RedisManager, mockInstance);
 *
 * // After test — restore
 * Facade.clearResolvedInstances();
 * ```
 *
 * @module facades/redis
 * @see {@link RedisManager} — the underlying service
 * @see {@link Facade} — the base class providing `make()`
 */

import { Facade } from '@stackra/ts-support';
import { RedisManager } from '@/services/redis-manager.service';

/**
 * RedisFacade — typed proxy for {@link RedisManager}.
 *
 * Resolves `RedisManager` from the DI container via the `RedisManager` token.
 * All property and method access is forwarded to the resolved instance
 * with correct `this` binding.
 *
 * Call `Facade.setApplication(app)` once during bootstrap before using this.
 *
 * @example
 * ```typescript
 * RedisFacade.connection();
 * ```
 */
export const RedisFacade: RedisManager = Facade.make<RedisManager>(RedisManager as any);
