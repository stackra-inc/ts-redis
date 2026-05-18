/**
 * Unit Tests — UpstashConnection
 *
 * Tests all Redis operations exposed by the UpstashConnection class.
 * All Upstash Redis client methods are mocked.
 *
 * @module @stackra/ts-redis/tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpstashConnection } from "@/connections/upstash.connection";

/**
 * Creates a mock Upstash Redis client.
 */
function createMockRedis() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    setex: vi.fn().mockResolvedValue("OK"),
    psetex: vi.fn().mockResolvedValue("OK"),
    setnx: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(300),
    mget: vi.fn().mockResolvedValue([]),
    mset: vi.fn().mockResolvedValue("OK"),
    incr: vi.fn().mockResolvedValue(1),
    incrby: vi.fn().mockResolvedValue(5),
    decr: vi.fn().mockResolvedValue(0),
    decrby: vi.fn().mockResolvedValue(-3),
    zadd: vi.fn().mockResolvedValue(1),
    zrange: vi.fn().mockResolvedValue([]),
    zrem: vi.fn().mockResolvedValue(1),
    zremrangebyscore: vi.fn().mockResolvedValue(2),
    eval: vi.fn().mockResolvedValue(null),
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn().mockReturnValue({ on: vi.fn() }),
    psubscribe: vi.fn().mockReturnValue({ on: vi.fn() }),
    flushdb: vi.fn().mockResolvedValue("OK"),
    pipeline: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      setex: vi.fn().mockReturnThis(),
      psetex: vi.fn().mockReturnThis(),
      del: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    }),
  };
}

describe("UpstashConnection", () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let connection: UpstashConnection;

  beforeEach(() => {
    mockRedis = createMockRedis();
    connection = new UpstashConnection(mockRedis as any, "test-connection");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Identity
  // ══════════════════════════════════════════════════════════════════════════

  describe("identity", () => {
    it("returns the connection name", () => {
      expect(connection.getName()).toBe("test-connection");
    });

    it("returns the underlying Redis client", () => {
      expect(connection.client()).toBe(mockRedis);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Basic Key-Value Operations
  // ══════════════════════════════════════════════════════════════════════════

  describe("get", () => {
    it("retrieves a value by key", async () => {
      mockRedis.get.mockResolvedValue("hello");
      const result = await connection.get("mykey");
      expect(result).toBe("hello");
      expect(mockRedis.get).toHaveBeenCalledWith("mykey");
    });

    it("returns null for non-existent keys", async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await connection.get("missing");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("sets a value without options", async () => {
      const result = await connection.set("key", "value");
      expect(result).toBe("OK");
      expect(mockRedis.set).toHaveBeenCalledWith("key", "value");
    });

    it("uses setex when ex option is provided", async () => {
      await connection.set("key", "value", { ex: 60 });
      expect(mockRedis.setex).toHaveBeenCalledWith("key", 60, "value");
    });

    it("uses psetex when px option is provided", async () => {
      await connection.set("key", "value", { px: 5000 });
      expect(mockRedis.psetex).toHaveBeenCalledWith("key", 5000, "value");
    });

    it("uses setnx when nx option is provided", async () => {
      mockRedis.setnx.mockResolvedValue(true);
      const result = await connection.set("key", "value", { nx: true });
      expect(result).toBe("OK");
      expect(mockRedis.setnx).toHaveBeenCalledWith("key", "value");
    });

    it("returns null when setnx fails", async () => {
      mockRedis.setnx.mockResolvedValue(false);
      const result = await connection.set("key", "value", { nx: true });
      expect(result).toBeNull();
    });

    it("checks existence when xx option is provided", async () => {
      mockRedis.exists.mockResolvedValue(1);
      await connection.set("key", "value", { xx: true });
      expect(mockRedis.exists).toHaveBeenCalledWith("key");
      expect(mockRedis.set).toHaveBeenCalledWith("key", "value");
    });

    it("returns null when xx and key does not exist", async () => {
      mockRedis.exists.mockResolvedValue(0);
      const result = await connection.set("key", "value", { xx: true });
      expect(result).toBeNull();
    });
  });

  describe("del", () => {
    it("deletes keys and returns count", async () => {
      mockRedis.del.mockResolvedValue(2);
      const result = await connection.del("key1", "key2");
      expect(result).toBe(2);
      expect(mockRedis.del).toHaveBeenCalledWith("key1", "key2");
    });

    it("returns 0 when no keys provided", async () => {
      const result = await connection.del();
      expect(result).toBe(0);
    });
  });

  describe("exists", () => {
    it("returns count of existing keys", async () => {
      mockRedis.exists.mockResolvedValue(2);
      const result = await connection.exists("key1", "key2");
      expect(result).toBe(2);
    });

    it("returns 0 when no keys provided", async () => {
      const result = await connection.exists();
      expect(result).toBe(0);
    });
  });

  describe("expire", () => {
    it("sets TTL on a key", async () => {
      mockRedis.expire.mockResolvedValue(1);
      const result = await connection.expire("key", 300);
      expect(result).toBe(1);
      expect(mockRedis.expire).toHaveBeenCalledWith("key", 300);
    });
  });

  describe("ttl", () => {
    it("returns remaining TTL", async () => {
      mockRedis.ttl.mockResolvedValue(120);
      const result = await connection.ttl("key");
      expect(result).toBe(120);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Multi-Key Operations
  // ══════════════════════════════════════════════════════════════════════════

  describe("mget", () => {
    it("retrieves multiple values", async () => {
      mockRedis.mget.mockResolvedValue(["val1", null, "val3"]);
      const result = await connection.mget("k1", "k2", "k3");
      expect(result).toEqual(["val1", null, "val3"]);
    });

    it("returns empty array when no keys provided", async () => {
      const result = await connection.mget();
      expect(result).toEqual([]);
    });
  });

  describe("mset", () => {
    it("sets multiple key-value pairs", async () => {
      const data = { key1: "val1", key2: "val2" };
      const result = await connection.mset(data);
      expect(result).toBe("OK");
      expect(mockRedis.mset).toHaveBeenCalledWith(data);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Increment/Decrement
  // ══════════════════════════════════════════════════════════════════════════

  describe("incr/decr", () => {
    it("increments by 1", async () => {
      mockRedis.incr.mockResolvedValue(5);
      const result = await connection.incr("counter");
      expect(result).toBe(5);
    });

    it("increments by a specific amount", async () => {
      mockRedis.incrby.mockResolvedValue(10);
      const result = await connection.incrby("counter", 5);
      expect(result).toBe(10);
    });

    it("decrements by 1", async () => {
      mockRedis.decr.mockResolvedValue(3);
      const result = await connection.decr("counter");
      expect(result).toBe(3);
    });

    it("decrements by a specific amount", async () => {
      mockRedis.decrby.mockResolvedValue(0);
      const result = await connection.decrby("counter", 3);
      expect(result).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Sorted Set Operations
  // ══════════════════════════════════════════════════════════════════════════

  describe("sorted sets", () => {
    it("adds a member with score", async () => {
      mockRedis.zadd.mockResolvedValue(1);
      const result = await connection.zadd("myset", 100, "member1");
      expect(result).toBe(1);
      expect(mockRedis.zadd).toHaveBeenCalledWith("myset", { score: 100, member: "member1" });
    });

    it("returns 0 when zadd returns null", async () => {
      mockRedis.zadd.mockResolvedValue(null);
      const result = await connection.zadd("myset", 100, "member1");
      expect(result).toBe(0);
    });

    it("gets range of members", async () => {
      mockRedis.zrange.mockResolvedValue(["a", "b", "c"]);
      const result = await connection.zrange("myset", 0, -1);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("removes members", async () => {
      mockRedis.zrem.mockResolvedValue(2);
      const result = await connection.zrem("myset", "a", "b");
      expect(result).toBe(2);
    });

    it("returns 0 when no members to remove", async () => {
      const result = await connection.zrem("myset");
      expect(result).toBe(0);
    });

    it("removes members by score range", async () => {
      mockRedis.zremrangebyscore.mockResolvedValue(3);
      const result = await connection.zremrangebyscore("myset", 0, 100);
      expect(result).toBe(3);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Lua Script
  // ══════════════════════════════════════════════════════════════════════════

  describe("eval", () => {
    it("executes a Lua script", async () => {
      mockRedis.eval.mockResolvedValue("result");
      const result = await connection.eval("return 1", ["key1"], ["arg1"]);
      expect(result).toBe("result");
      expect(mockRedis.eval).toHaveBeenCalledWith("return 1", ["key1"], ["arg1"]);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Pipeline
  // ══════════════════════════════════════════════════════════════════════════

  describe("pipeline", () => {
    it("creates a pipeline wrapper", () => {
      const pipe = connection.pipeline();
      expect(pipe).toBeDefined();
      expect(pipe.get).toBeTypeOf("function");
      expect(pipe.set).toBeTypeOf("function");
      expect(pipe.del).toBeTypeOf("function");
      expect(pipe.exec).toBeTypeOf("function");
    });

    it("pipeline get returns the wrapper for chaining", () => {
      const pipe = connection.pipeline();
      const result = pipe.get("key");
      expect(result).toBe(pipe);
    });

    it("pipeline set with ex uses setex", () => {
      const pipe = connection.pipeline();
      pipe.set("key", "value", { ex: 60 });
      const mockPipe = mockRedis.pipeline();
      expect(mockPipe.setex).toHaveBeenCalledWith("key", 60, "value");
    });

    it("pipeline set with px uses psetex", () => {
      const pipe = connection.pipeline();
      pipe.set("key", "value", { px: 5000 });
      const mockPipe = mockRedis.pipeline();
      expect(mockPipe.psetex).toHaveBeenCalledWith("key", 5000, "value");
    });

    it("pipeline set without options uses plain set", () => {
      const pipe = connection.pipeline();
      pipe.set("key", "value");
      const mockPipe = mockRedis.pipeline();
      expect(mockPipe.set).toHaveBeenCalledWith("key", "value");
    });

    it("pipeline exec returns results", async () => {
      const pipe = connection.pipeline();
      const mockPipe = mockRedis.pipeline();
      mockPipe.exec.mockResolvedValue([["OK"], [null]]);
      const results = await pipe.exec();
      expect(results).toEqual([["OK"], [null]]);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Pub/Sub
  // ══════════════════════════════════════════════════════════════════════════

  describe("pub/sub", () => {
    it("publishes a message", async () => {
      mockRedis.publish.mockResolvedValue(3);
      const result = await connection.publish("channel", "hello");
      expect(result).toBe(3);
      expect(mockRedis.publish).toHaveBeenCalledWith("channel", "hello");
    });

    it("subscribes to channels", () => {
      const subscriber = connection.subscribe("my-channel");
      expect(subscriber).toBeDefined();
      expect(mockRedis.subscribe).toHaveBeenCalledWith("my-channel");
    });

    it("pattern subscribes", () => {
      const subscriber = connection.psubscribe("events.*");
      expect(subscriber).toBeDefined();
      expect(mockRedis.psubscribe).toHaveBeenCalledWith("events.*");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Maintenance
  // ══════════════════════════════════════════════════════════════════════════

  describe("maintenance", () => {
    it("flushes the database", async () => {
      const result = await connection.flushdb();
      expect(result).toBe("OK");
    });

    it("disconnect is a no-op for HTTP client", async () => {
      await expect(connection.disconnect()).resolves.toBeUndefined();
    });
  });
});
