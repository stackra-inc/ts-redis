/**
 * Unit Tests — Event Emission Paths
 *
 * Tests that the RedisManager correctly emits lifecycle events through
 * the optional event emitter.
 *
 * Covers:
 * - Events emitted when emitter is present
 * - No-op when emitter is absent
 * - Error handling when emitter throws
 *
 * @module @stackra/ts-redis/tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { REDIS_EVENTS } from "@stackra/contracts";

vi.mock("@stackra/ts-support", () => {
  class MultipleInstanceManager<T> {
    private instances: Map<string, T> = new Map();
    private pendingPromises: Map<string, Promise<T>> = new Map();

    instance(name: string): T {
      const existing = this.instances.get(name);
      if (!existing) throw new Error(`Instance "${name}" not resolved yet`);
      return existing;
    }

    async instanceAsync(name?: string): Promise<T> {
      const instanceName = name ?? this.getDefaultInstance();
      const existing = this.instances.get(instanceName);
      if (existing) return existing;

      const pending = this.pendingPromises.get(instanceName);
      if (pending) return pending;

      const config = this.getInstanceConfig(instanceName);
      if (!config) throw new Error(`Connection "${instanceName}" is not configured`);

      const promise = this.createDriverAsync(config.driver, config).then((instance) => {
        this.instances.set(instanceName, instance);
        this.pendingPromises.delete(instanceName);
        return instance;
      });

      this.pendingPromises.set(instanceName, promise);
      return promise;
    }

    hasInstance(name: string): boolean {
      return this.instances.has(name);
    }

    getResolvedInstances(): string[] {
      return Array.from(this.instances.keys());
    }

    forgetInstance(name?: string | string[]): this {
      const names = name ? (Array.isArray(name) ? name : [name]) : [this.getDefaultInstance()];
      for (const n of names) this.instances.delete(n);
      return this;
    }

    purge(): void {
      this.instances.clear();
    }

    protected getDefaultInstance(): string {
      return "default";
    }

    protected getInstanceConfig(_name: string): Record<string, any> | undefined {
      return undefined;
    }

    protected createDriver(_driver: string, _config: Record<string, any>): T {
      throw new Error("Use async");
    }

    protected async createDriverAsync(_driver: string, _config: Record<string, any>): Promise<T> {
      throw new Error("Not implemented");
    }
  }

  return { MultipleInstanceManager };
});

vi.mock("@stackra/ts-container", () => ({
  Injectable: () => (target: any) => target,
  Inject: () => () => undefined,
  Optional: () => () => undefined,
  DiscoveryService: class {},
}));

vi.mock("@stackra/ts-logger", () => ({
  Logger: class {
    info() {}
    warn() {}
    error() {}
  },
}));

import { RedisManager } from "@/services/redis-manager.service";

function createMockConnection(name: string = "mock") {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getName: vi.fn(() => name),
  };
}

function createMockConnector() {
  return {
    connect: vi.fn().mockImplementation(async () => createMockConnection()),
  };
}

describe("RedisManager — Event Emission", () => {
  const config = {
    default: "cache",
    connections: {
      cache: { url: "https://cache.upstash.io", token: "tok" },
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Emitter present
  // ══════════════════════════════════════════════════════════════════════════

  describe("emitter present", () => {
    it("emits CONNECTED event on successful connection", async () => {
      const emitter = { emit: vi.fn() };
      const connector = createMockConnector();
      const manager = new (RedisManager as any)(config, connector, emitter);

      await manager.connection("cache");

      expect(emitter.emit).toHaveBeenCalledWith(
        REDIS_EVENTS.CONNECTED,
        expect.objectContaining({ connection: "cache" }),
      );
    });

    it("emits DISCONNECTED event on disconnect", async () => {
      const emitter = { emit: vi.fn() };
      const connector = createMockConnector();
      const manager = new (RedisManager as any)(config, connector, emitter);

      await manager.connection("cache");
      await manager.disconnect("cache");

      expect(emitter.emit).toHaveBeenCalledWith(
        REDIS_EVENTS.DISCONNECTED,
        expect.objectContaining({ connection: "cache" }),
      );
    });

    it("emits ERROR event when connection fails", async () => {
      const emitter = { emit: vi.fn() };
      const connector = {
        connect: vi.fn().mockRejectedValue(new Error("Connection refused")),
      };
      const manager = new (RedisManager as any)(config, connector, emitter);

      await expect(manager.connection("cache")).rejects.toThrow("Connection refused");

      expect(emitter.emit).toHaveBeenCalledWith(
        REDIS_EVENTS.ERROR,
        expect.objectContaining({
          connection: "cache",
          error: "Connection refused",
        }),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Emitter absent
  // ══════════════════════════════════════════════════════════════════════════

  describe("emitter absent", () => {
    it("does not throw when emitter is undefined", async () => {
      const connector = createMockConnector();
      const manager = new (RedisManager as any)(config, connector, undefined);

      // Should not throw even without an emitter
      await expect(manager.connection("cache")).resolves.toBeDefined();
    });

    it("disconnect works without emitter", async () => {
      const connector = createMockConnector();
      const manager = new (RedisManager as any)(config, connector, undefined);

      await manager.connection("cache");
      await expect(manager.disconnect("cache")).resolves.toBeUndefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Emitter throws
  // ══════════════════════════════════════════════════════════════════════════

  describe("emitter throws", () => {
    it("does not propagate emitter errors on connect", async () => {
      const emitter = {
        emit: vi.fn().mockImplementation(() => {
          throw new Error("Emitter broken");
        }),
      };
      const connector = createMockConnector();
      const manager = new (RedisManager as any)(config, connector, emitter);

      // Should not throw — emitter errors are caught
      await expect(manager.connection("cache")).resolves.toBeDefined();
    });

    it("does not propagate emitter errors on disconnect", async () => {
      const emitter = {
        emit: vi.fn().mockImplementation(() => {
          throw new Error("Emitter broken");
        }),
      };
      const connector = createMockConnector();
      const manager = new (RedisManager as any)(config, connector, emitter);

      await manager.connection("cache");
      await expect(manager.disconnect("cache")).resolves.toBeUndefined();
    });
  });
});
