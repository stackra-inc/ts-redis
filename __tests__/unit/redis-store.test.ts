/**
 * Unit Tests — RedisStore
 *
 * Tests the standalone (non-DI) Redis cache store implementing IStore.
 *
 * @module @stackra/ts-redis/tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RedisStore } from "@/stores/redis.store";

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

describe("RedisStore", () => {
  let mockConnection: ReturnType<typeof createMockConnection>;
  let store: RedisStore;

  beforeEach(() => {
    mockConnection = createMockConnection();
    store = new RedisStore({
      connection: mockConnection as any,
      prefix: "test:",
      defaultTtl: 600,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Constructor defaults
  // ══════════════════════════════════════════════════════════════════════════

  describe("constructor defaults", () => {
    it("uses default prefix when not specified", () => {
      const s = new RedisStore({ connection: mockConnection as any });
      expect(s.getPrefix()).toBe("cache:");
    });

    it("uses default TTL of 300 when not specified", async () => {
      const s = new RedisStore({ connection: mockConnection as any });
      await s.put("key", "value", 0);
      expect(mockConnection.set).toHaveBeenCalledWith("cache:key", JSON.stringify("value"), {
        ex: 300,
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // get
  // ══════════════════════════════════════════════════════════════════════════

  describe("get", () => {
    it("returns undefined for missing keys", async () => {
      const result = await store.get("missing");
      expect(result).toBeUndefined();
    });

    it("deserializes JSON values", async () => {
      mockConnection.get.mockResolvedValue(JSON.stringify({ id: 1 }));
      const result = await store.get("user");
      expect(result).toEqual({ id: 1 });
    });

    it("returns raw string for non-JSON values", async () => {
      mockConnection.get.mockResolvedValue("not-json");
      const result = await store.get("raw");
      expect(result).toBe("not-json");
    });

    it("applies prefix to key", async () => {
      await store.get("mykey");
      expect(mockConnection.get).toHaveBeenCalledWith("test:mykey");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // many
  // ══════════════════════════════════════════════════════════════════════════

  describe("many", () => {
    it("returns empty object for empty keys", async () => {
      const result = await store.many([]);
      expect(result).toEqual({});
    });

    it("retrieves and deserializes multiple values", async () => {
      mockConnection.mget.mockResolvedValue([JSON.stringify("a"), null, JSON.stringify(42)]);
      const result = await store.many(["k1", "k2", "k3"]);
      expect(result).toEqual({ k1: "a", k2: undefined, k3: 42 });
    });

    it("applies prefix to all keys", async () => {
      await store.many(["a", "b"]);
      expect(mockConnection.mget).toHaveBeenCalledWith("test:a", "test:b");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // put
  // ══════════════════════════════════════════════════════════════════════════

  describe("put", () => {
    it("serializes and stores with TTL", async () => {
      const result = await store.put("key", { x: 1 }, 120);
      expect(result).toBe(true);
      expect(mockConnection.set).toHaveBeenCalledWith("test:key", JSON.stringify({ x: 1 }), {
        ex: 120,
      });
    });

    it("uses default TTL when seconds is 0 or negative", async () => {
      await store.put("key", "val", 0);
      expect(mockConnection.set).toHaveBeenCalledWith("test:key", JSON.stringify("val"), {
        ex: 600,
      });
    });

    it("returns false when set returns non-OK", async () => {
      mockConnection.set.mockResolvedValue(null);
      const result = await store.put("key", "val", 60);
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // putMany
  // ══════════════════════════════════════════════════════════════════════════

  describe("putMany", () => {
    it("uses pipeline for batch writes", async () => {
      const result = await store.putMany({ a: 1, b: 2 }, 60);
      expect(result).toBe(true);
      expect(mockConnection.pipeline).toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // forever
  // ══════════════════════════════════════════════════════════════════════════

  describe("forever", () => {
    it("stores without TTL", async () => {
      const result = await store.forever("key", "permanent");
      expect(result).toBe(true);
      expect(mockConnection.set).toHaveBeenCalledWith("test:key", JSON.stringify("permanent"));
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // increment / decrement
  // ══════════════════════════════════════════════════════════════════════════

  describe("increment/decrement", () => {
    it("increments with default value", async () => {
      mockConnection.incrby.mockResolvedValue(1);
      const result = await store.increment("counter");
      expect(result).toBe(1);
      expect(mockConnection.incrby).toHaveBeenCalledWith("test:counter", 1);
    });

    it("increments by specified amount", async () => {
      mockConnection.incrby.mockResolvedValue(10);
      const result = await store.increment("counter", 10);
      expect(result).toBe(10);
    });

    it("decrements with default value", async () => {
      mockConnection.decrby.mockResolvedValue(4);
      const result = await store.decrement("counter");
      expect(result).toBe(4);
      expect(mockConnection.decrby).toHaveBeenCalledWith("test:counter", 1);
    });

    it("decrements by specified amount", async () => {
      mockConnection.decrby.mockResolvedValue(0);
      const result = await store.decrement("counter", 5);
      expect(result).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // forget
  // ══════════════════════════════════════════════════════════════════════════

  describe("forget", () => {
    it("deletes key and returns true", async () => {
      mockConnection.del.mockResolvedValue(1);
      const result = await store.forget("key");
      expect(result).toBe(true);
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
        .mockResolvedValueOnce([42, ["test:a", "test:b"]])
        .mockResolvedValueOnce([0, ["test:c"]]);
      const result = await store.flush();
      expect(result).toBe(true);
      expect(mockConnection.scan).toHaveBeenCalledWith(0, { match: "test:*", count: 100 });
      expect(mockConnection.del).toHaveBeenCalledWith("test:a", "test:b");
      expect(mockConnection.del).toHaveBeenCalledWith("test:c");
    });

    it("handles empty scan results", async () => {
      mockConnection.scan = vi.fn().mockResolvedValueOnce([0, []]);
      const result = await store.flush();
      expect(result).toBe(true);
      expect(mockConnection.del).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getPrefix
  // ══════════════════════════════════════════════════════════════════════════

  describe("getPrefix", () => {
    it("returns configured prefix", () => {
      expect(store.getPrefix()).toBe("test:");
    });
  });
});
