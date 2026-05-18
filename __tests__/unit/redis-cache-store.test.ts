/**
 * Unit Tests — RedisCacheStore
 *
 * Tests the DI-managed Redis cache store implementing IStore.
 * Covers serialization, prefix handling, and all IStore methods.
 *
 * @module @stackra/ts-redis/tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RedisCacheStore } from "@/stores/redis-cache.store";

vi.mock("@stackra/ts-container", () => ({
  Injectable: () => (target: any) => target,
  Inject: () => () => undefined,
  Optional: () => () => undefined,
  DiscoveryService: class {},
}));

vi.mock("@stackra/ts-cache", () => ({
  CacheStore: () => (target: any) => target,
}));

vi.mock("@stackra/ts-logger", () => ({
  Logger: class {
    info() {}
    warn() {}
    error() {}
  },
}));

/**
 * Creates a mock RedisConnection.
 */
function createMockConnection() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    mget: vi.fn().mockResolvedValue([]),
    incrby: vi.fn().mockResolvedValue(1),
    decrby: vi.fn().mockResolvedValue(0),
    flushdb: vi.fn().mockResolvedValue("OK"),
    pipeline: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    }),
  };
}

/**
 * Creates a mock RedisManager.
 */
function createMockRedisManager(connection: ReturnType<typeof createMockConnection>) {
  return {
    connection: vi.fn().mockResolvedValue(connection),
  };
}

describe("RedisCacheStore", () => {
  let mockConnection: ReturnType<typeof createMockConnection>;
  let mockManager: ReturnType<typeof createMockRedisManager>;
  let store: RedisCacheStore;

  beforeEach(async () => {
    mockConnection = createMockConnection();
    mockManager = createMockRedisManager(mockConnection);

    const config = {
      default: "cache",
      connections: { cache: { url: "http://test", token: "tok" } },
      cacheStore: { prefix: "app:", ttl: 300, connection: "cache" },
    };

    store = new (RedisCacheStore as any)(mockManager, config);
    await store.onModuleInit();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Initialization
  // ══════════════════════════════════════════════════════════════════════════

  describe("initialization", () => {
    it("resolves connection on module init", () => {
      expect(mockManager.connection).toHaveBeenCalledWith("cache");
    });

    it("uses default connection when cacheStore.connection is not set", async () => {
      const config = {
        default: "main",
        connections: { main: { url: "http://test", token: "tok" } },
      };
      const newStore = new (RedisCacheStore as any)(mockManager, config);
      await newStore.onModuleInit();
      expect(mockManager.connection).toHaveBeenCalledWith("main");
    });

    it("uses default prefix when not configured", () => {
      const config = {
        default: "cache",
        connections: { cache: { url: "http://test", token: "tok" } },
      };
      const newStore = new (RedisCacheStore as any)(mockManager, config);
      expect(newStore.getPrefix()).toBe("cache:");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // get
  // ══════════════════════════════════════════════════════════════════════════

  describe("get", () => {
    it("returns undefined for missing keys", async () => {
      mockConnection.get.mockResolvedValue(null);
      const result = await store.get("missing");
      expect(result).toBeUndefined();
    });

    it("deserializes JSON values", async () => {
      mockConnection.get.mockResolvedValue(JSON.stringify({ name: "Alice" }));
      const result = await store.get("user");
      expect(result).toEqual({ name: "Alice" });
    });

    it("returns raw string for non-JSON values", async () => {
      mockConnection.get.mockResolvedValue("plain-string");
      const result = await store.get("raw");
      expect(result).toBe("plain-string");
    });

    it("applies prefix to key", async () => {
      await store.get("mykey");
      expect(mockConnection.get).toHaveBeenCalledWith("app:mykey");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // many
  // ══════════════════════════════════════════════════════════════════════════

  describe("many", () => {
    it("returns empty object for empty keys array", async () => {
      const result = await store.many([]);
      expect(result).toEqual({});
    });

    it("retrieves multiple values with prefix", async () => {
      mockConnection.mget.mockResolvedValue([
        JSON.stringify("val1"),
        null,
        JSON.stringify({ x: 1 }),
      ]);
      const result = await store.many(["k1", "k2", "k3"]);
      expect(result).toEqual({ k1: "val1", k2: undefined, k3: { x: 1 } });
      expect(mockConnection.mget).toHaveBeenCalledWith("app:k1", "app:k2", "app:k3");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // put
  // ══════════════════════════════════════════════════════════════════════════

  describe("put", () => {
    it("serializes and stores value with TTL", async () => {
      const result = await store.put("key", { data: 1 }, 60);
      expect(result).toBe(true);
      expect(mockConnection.set).toHaveBeenCalledWith("app:key", JSON.stringify({ data: 1 }), {
        ex: 60,
      });
    });

    it("uses default TTL when seconds is 0", async () => {
      await store.put("key", "value", 0);
      expect(mockConnection.set).toHaveBeenCalledWith("app:key", JSON.stringify("value"), {
        ex: 300,
      });
    });

    it("returns false when set fails", async () => {
      mockConnection.set.mockResolvedValue(null);
      const result = await store.put("key", "value", 60);
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // putMany
  // ══════════════════════════════════════════════════════════════════════════

  describe("putMany", () => {
    it("uses pipeline for batch writes", async () => {
      const result = await store.putMany({ a: 1, b: 2 }, 120);
      expect(result).toBe(true);
      const pipe = mockConnection.pipeline();
      expect(pipe.set).toHaveBeenCalled();
      expect(pipe.exec).toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // forever
  // ══════════════════════════════════════════════════════════════════════════

  describe("forever", () => {
    it("stores value without TTL", async () => {
      const result = await store.forever("key", "permanent");
      expect(result).toBe(true);
      expect(mockConnection.set).toHaveBeenCalledWith("app:key", JSON.stringify("permanent"));
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // increment / decrement
  // ══════════════════════════════════════════════════════════════════════════

  describe("increment/decrement", () => {
    it("increments by default value of 1", async () => {
      mockConnection.incrby.mockResolvedValue(5);
      const result = await store.increment("counter");
      expect(result).toBe(5);
      expect(mockConnection.incrby).toHaveBeenCalledWith("app:counter", 1);
    });

    it("increments by specified value", async () => {
      mockConnection.incrby.mockResolvedValue(10);
      const result = await store.increment("counter", 5);
      expect(result).toBe(10);
      expect(mockConnection.incrby).toHaveBeenCalledWith("app:counter", 5);
    });

    it("decrements by default value of 1", async () => {
      mockConnection.decrby.mockResolvedValue(3);
      const result = await store.decrement("counter");
      expect(result).toBe(3);
      expect(mockConnection.decrby).toHaveBeenCalledWith("app:counter", 1);
    });

    it("decrements by specified value", async () => {
      mockConnection.decrby.mockResolvedValue(0);
      const result = await store.decrement("counter", 3);
      expect(result).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // forget
  // ══════════════════════════════════════════════════════════════════════════

  describe("forget", () => {
    it("deletes a key and returns true", async () => {
      mockConnection.del.mockResolvedValue(1);
      const result = await store.forget("key");
      expect(result).toBe(true);
      expect(mockConnection.del).toHaveBeenCalledWith("app:key");
    });

    it("returns false when key does not exist", async () => {
      mockConnection.del.mockResolvedValue(0);
      const result = await store.forget("missing");
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // flush
  // ══════════════════════════════════════════════════════════════════════════

  describe("flush", () => {
    it("uses SCAN to find and delete prefixed keys", async () => {
      mockConnection.scan = vi
        .fn()
        .mockResolvedValueOnce([42, ["app:key1", "app:key2"]])
        .mockResolvedValueOnce([0, ["app:key3"]]);
      const result = await store.flush();
      expect(result).toBe(true);
      expect(mockConnection.scan).toHaveBeenCalledWith(0, { match: "app:*", count: 100 });
      expect(mockConnection.del).toHaveBeenCalledWith("app:key1", "app:key2");
      expect(mockConnection.del).toHaveBeenCalledWith("app:key3");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getPrefix
  // ══════════════════════════════════════════════════════════════════════════

  describe("getPrefix", () => {
    it("returns the configured prefix", () => {
      expect(store.getPrefix()).toBe("app:");
    });
  });
});
