/**
 * @fileoverview Vitest setup file for @stackra/ts-redis package
 *
 * This file configures the testing environment before running tests.
 * It mocks DI decorators and support classes so tests can run without
 * the full IoC container or @stackra/ts-support installed.
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
 */
vi.mock('@stackra/ts-container', () => ({
  Injectable:
    () =>
    (target: unknown): unknown =>
      target,
  Inject:
    () =>
    (_target: unknown, _key: string | symbol, _index: number): void => {},
  Optional:
    () =>
    (_target: unknown, _key: string | symbol, _index: number): void => {},
  Module:
    () =>
    (target: unknown): unknown =>
      target,
}));

/**
 * Mock @stackra/ts-support — provides a stub MultipleInstanceManager
 * so RedisManager can extend it without the real package installed.
 *
 * The stub stores instances in a Map and exposes the methods that
 * RedisManager calls: instanceAsync, hasInstance, instance,
 * forgetInstance, getResolvedInstances, and purge.
 */
vi.mock('@stackra/ts-support', () => {
  class MultipleInstanceManager<T> {
    private _instances = new Map<string, T>();
    private _pending = new Map<string, Promise<T>>();

    protected getDefaultInstance(): string {
      return '';
    }

    protected getInstanceConfig(_name: string): Record<string, unknown> | undefined {
      return undefined;
    }

    protected createDriver(_driver: string, _config: Record<string, unknown>): T {
      throw new Error('Not implemented');
    }

    protected async createDriverAsync(
      _driver: string,
      _config: Record<string, unknown>,
    ): Promise<T> {
      throw new Error('Not implemented');
    }

    protected async instanceAsync(name?: string): Promise<T> {
      const key = name ?? this.getDefaultInstance();
      if (this._instances.has(key)) {
        return this._instances.get(key) as T;
      }
      if (this._pending.has(key)) {
        return this._pending.get(key) as Promise<T>;
      }
      const config = this.getInstanceConfig(key);
      if (!config) {
        throw new Error(`Redis connection [${key}] not configured`);
      }
      const promise = this.createDriverAsync(config.driver as string, config).then((inst) => {
        this._instances.set(key, inst);
        this._pending.delete(key);
        return inst;
      });
      this._pending.set(key, promise);
      return promise;
    }

    protected instance(name: string): T {
      return this._instances.get(name) as T;
    }

    protected hasInstance(name: string): boolean {
      return this._instances.has(name);
    }

    protected forgetInstance(name: string): void {
      this._instances.delete(name);
    }

    protected getResolvedInstances(): string[] {
      return Array.from(this._instances.keys());
    }

    protected purge(): void {
      this._instances.clear();
    }
  }

  class Facade {
    static make<T>(_token: unknown): T {
      return {} as T;
    }

    static setApplication(): void {}
    static swap(): void {}
    static clearResolvedInstances(): void {}
  }

  return { MultipleInstanceManager, Facade };
});
