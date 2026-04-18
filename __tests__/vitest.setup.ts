/**
 * @fileoverview Vitest setup file for @stackra/ts-redis package
 *
 * This file configures the testing environment before running tests.
 * It mocks DI decorators so tests can run without the full IoC container.
 *
 * Setup Features:
 * - Mocks @Injectable() decorator to pass-through the class unchanged
 * - Mocks @Inject() decorator to no-op (no actual injection in tests)
 * - Mocks @Optional() decorator to no-op
 * - Mocks @Module() decorator to pass-through the class unchanged
 *
 * This allows testing service logic in isolation without bootstrapping
 * the entire DI container.
 *
 * @module @stackra/ts-redis
 * @category Configuration
 */

import { vi } from 'vitest';

/**
 * Mock @stackra/ts-container decorators.
 *
 * Replaces DI decorators with no-op implementations so that:
 * - Classes decorated with @Injectable() are returned unchanged
 * - Constructor parameters decorated with @Inject() are ignored
 * - @Optional() parameters are ignored
 * - @Module() metadata is ignored
 *
 * This ensures decorator metadata doesn't interfere with tests
 * and allows testing module behavior in isolation.
 */
vi.mock('@stackra/ts-container', async () => {
  // Import the actual module to preserve non-decorator exports
  const actual = await vi.importActual('@stackra/ts-container');

  return {
    ...actual,

    // @Injectable() — returns the class unchanged (no container registration)
    Injectable: () => (target: any) => target,

    // @Inject(TOKEN) — no-op (no actual parameter injection)
    Inject: () => (_target: any, _propertyKey: string, _parameterIndex: number) => {},

    // @Optional() — no-op (no optional injection handling)
    Optional: () => (_target: any, _propertyKey: string, _parameterIndex: number) => {},

    // @Module(metadata) — returns the class unchanged (no module registration)
    Module: (_metadata: any) => (target: any) => target,
  };
});
