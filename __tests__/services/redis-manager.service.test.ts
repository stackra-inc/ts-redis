/**
 * @fileoverview Tests for RedisManager
 *
 * This test suite verifies the RedisManager service which orchestrates
 * multiple named Redis connections. Tests cover:
 *
 * - Connection creation and caching (lazy async instantiation)
 * - Default connection resolution
 * - Multi-connection management
 * - Connection introspection (getConnectionNames, isConnectionActive)
 * - Connection disconnection and cleanup
 * - Lifecycle hooks (onModuleInit, onModuleDestroy)
 * - Error handling for unconfigured connections
 *
 * The RedisManager extends MultipleInstanceManager from @stackra/ts-support,
 * using the async resolution path since Redis connections require async init.
 *
 * @module @stackra/ts-redis
 * @category Tests / Services
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@stackra/ts-support", () => {
  /**
   * Minimal MultipleInstanceManager mock with async support.
   */
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

      // Deduplication
      const pending = this.pendingPromises.get(instanceName);
      if (pending) return pending;

      const config = this.getInstanceConfig(instanceName);
      if (!config) {
        throw new Error(`Connection "${instanceName}" is not configured`);
      }

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
      for (const n of names) {
        this.instances.delete(n);
      }
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
import type { RedisConnection, RedisConnector, RedisConfig } from "@stackra/contracts";

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a mock RedisConnection for testing.
 */
function createMockConnection(name: string = "mock"): RedisConnection {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getName: vi.fn(() => name),
  } as unknown as RedisConnection;
}

/**
 * Creates a mock RedisConnector for testing.
 */
function createMockConnector(): RedisConnector {
  return {
    connect: vi.fn().mockImplementation(async () => createMockConnection()),
  };
}

/**
 * Creates a RedisManager with injected dependencies.
 */
function createManager(config: RedisConfig, connector?: RedisConnector): RedisManager {
  const mockConnector = connector ?? createMockConnector();
  return new (RedisManager as any)(config, mockConnector, undefined);
}

// ============================================================================
// Test Suite
// ============================================================================

describe("RedisManager", () => {
  let config: RedisConfig;
  let connector: RedisConnector;
  let manager: RedisManager;

  beforeEach(() => {
    // Arrange: Create manager with multi-connection config
    config = {
      default: "cache",
      connections: {
        cache: { url: "https://cache.upstash.io", token: "cache-token" },
        session: { url: "https://session.upstash.io", token: "session-token" },
      },
    } as RedisConfig;

    connector = createMockConnector();
    manager = createManager(config, connector);
  });

  // ── Connection Access ───────────────────────────────────────────────────

  describe("connection()", () => {
    it("should create and return a connection for the default name", async () => {
      // Act: Get default connection
      const connection = await manager.connection();

      // Assert: Connection is returned
      expect(connection).toBeDefined();
      expect(connector.connect).toHaveBeenCalled();
    });

    it("should create and return a connection for a named connection", async () => {
      // Act: Get named connection
      const connection = await manager.connection("session");

      // Assert: Connection is returned
      expect(connection).toBeDefined();
    });

    it("should cache and reuse connections", async () => {
      // Act: Get the same connection twice
      const first = await manager.connection("cache");
      const second = await manager.connection("cache");

      // Assert: Same instance is returned, connector called only once
      expect(first).toBe(second);
      expect(connector.connect).toHaveBeenCalledTimes(1);
    });

    it("should throw for unconfigured connection names", async () => {
      // Act & Assert: Should throw for unknown connection
      await expect(manager.connection("nonexistent")).rejects.toThrow();
    });
  });

  // ── Introspection ───────────────────────────────────────────────────────

  describe("Introspection", () => {
    it("should return all configured connection names", () => {
      // Act: Get connection names
      const names = manager.getConnectionNames();

      // Assert: All configured connections are listed
      expect(names).toContain("cache");
      expect(names).toContain("session");
      expect(names.length).toBe(2);
    });

    it("should return the default connection name", () => {
      // Act: Get default name
      const defaultName = manager.getDefaultConnectionName();

      // Assert: Returns configured default
      expect(defaultName).toBe("cache");
    });

    it("should report active connections correctly", async () => {
      // Arrange: No connections active yet
      expect(manager.isConnectionActive("cache")).toBe(false);

      // Act: Resolve a connection
      await manager.connection("cache");

      // Assert: Connection is now active
      expect(manager.isConnectionActive("cache")).toBe(true);
      expect(manager.isConnectionActive("session")).toBe(false);
    });

    it("should return active connection names", async () => {
      // Arrange: Resolve some connections
      await manager.connection("cache");
      await manager.connection("session");

      // Act: Get active names
      const active = manager.getActiveConnectionNames();

      // Assert: Both are active
      expect(active).toContain("cache");
      expect(active).toContain("session");
    });
  });

  // ── Lifecycle ───────────────────────────────────────────────────────────

  describe("Lifecycle", () => {
    it("should have onModuleInit method", () => {
      expect(typeof manager.onModuleInit).toBe("function");
    });

    it("should have onModuleDestroy method", () => {
      expect(typeof manager.onModuleDestroy).toBe("function");
    });

    it("should warm the default connection on init", async () => {
      // Act: Call onModuleInit
      await manager.onModuleInit();

      // Assert: Default connection was created
      expect(connector.connect).toHaveBeenCalled();
    });
  });
});
