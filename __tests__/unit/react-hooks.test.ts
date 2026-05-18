/**
 * Unit Tests — React Hooks (useRedis, useRedisConnection)
 *
 * Tests the React hooks for accessing Redis in components.
 *
 * @module @stackra/ts-redis/tests
 */
import { describe, it, expect, vi } from "vitest";

const mockManager = {
  connection: vi.fn().mockResolvedValue({ get: vi.fn(), set: vi.fn() }),
  getConnectionNames: vi.fn().mockReturnValue(["cache"]),
};

vi.mock("@stackra/ts-container/react", () => ({
  useInject: () => mockManager,
}));

import { useRedis } from "@/hooks/use-redis/use-redis.hook";
import { useRedisConnection } from "@/hooks/use-redis-connection/use-redis-connection.hook";

describe("useRedis", () => {
  it("returns the RedisManager instance", () => {
    const result = useRedis();
    expect(result).toBe(mockManager);
  });

  it("provides access to manager methods", () => {
    const result = useRedis();
    expect(result.getConnectionNames()).toEqual(["cache"]);
  });
});

describe("useRedisConnection", () => {
  it("returns a promise resolving to a connection", async () => {
    const result = useRedisConnection("cache");
    expect(result).toBeInstanceOf(Promise);
    const conn = await result;
    expect(conn).toBeDefined();
  });

  it("calls manager.connection with the provided name", () => {
    useRedisConnection("session");
    expect(mockManager.connection).toHaveBeenCalledWith("session");
  });

  it("uses default connection when no name provided", () => {
    useRedisConnection();
    expect(mockManager.connection).toHaveBeenCalledWith(undefined);
  });
});
