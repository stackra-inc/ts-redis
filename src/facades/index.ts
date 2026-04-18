/**
 * Facades Barrel Export
 *
 * Typed proxies for DI container services in this package.
 * Each facade is a module-level constant that lazily resolves
 * its service from the container on first property access.
 *
 * Exported: {@link RedisFacade}
 *
 * ## Setup (once, in main.tsx)
 *
 * ```typescript
 * import { Application } from '@stackra/ts-container';
 * import { Facade } from '@stackra/ts-support';
 *
 * const app = await Application.create(AppModule);
 * Facade.setApplication(app); // wires all facades at once
 * ```
 *
 * @module facades
 */

export { RedisFacade } from './redis.facade';
