/**
 * Unit Tests — Decorators (@InjectRedis, @InjectRedisManager)
 *
 * Tests the DI injection decorators for Redis.
 *
 * @module @stackra/ts-redis/tests
 */
import { describe, it, expect, vi } from "vitest";
import { REDIS_MANAGER } from "@stackra/contracts";
import { getRedisConnectionToken } from "@/decorators/get-redis-connection-token.util";

// Track what Inject is called with
const injectCalls: any[] = [];
vi.mock("@stackra/ts-container", () => ({
  Inject: (token: any) => {
    injectCalls.push(token);
    return () => undefined;
  },
}));

import { InjectRedis } from "@/decorators/inject-redis.decorator";
import { InjectRedisManager } from "@/decorators/inject-redis-manager.decorator";

describe("@InjectRedis", () => {
  it("creates a decorator", () => {
    const decorator = InjectRedis();
    expect(decorator).toBeTypeOf("function");
  });

  it("uses default connection token when no name provided", () => {
    injectCalls.length = 0;
    InjectRedis();
    expect(injectCalls).toContain(getRedisConnectionToken());
  });

  it("uses named connection token when name provided", () => {
    injectCalls.length = 0;
    InjectRedis("cache");
    expect(injectCalls).toContain(getRedisConnectionToken("cache"));
  });
});

describe("@InjectRedisManager", () => {
  it("creates a decorator", () => {
    const decorator = InjectRedisManager();
    expect(decorator).toBeTypeOf("function");
  });

  it("uses REDIS_MANAGER token", () => {
    injectCalls.length = 0;
    InjectRedisManager();
    expect(injectCalls).toContain(REDIS_MANAGER);
  });
});

describe("getRedisConnectionToken", () => {
  it("returns default token when no name", () => {
    expect(getRedisConnectionToken()).toBe("RedisConnection:default");
  });

  it("returns named token", () => {
    expect(getRedisConnectionToken("cache")).toBe("RedisConnection:cache");
  });

  it("returns named token for session", () => {
    expect(getRedisConnectionToken("session")).toBe("RedisConnection:session");
  });
});
