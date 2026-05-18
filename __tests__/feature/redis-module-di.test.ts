/**
 * Integration Tests — RedisModule.forRoot() DI Bootstrap
 *
 * Tests the full DI module registration and token resolution.
 *
 * @module @stackra/ts-redis/tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { REDIS_CONFIG, REDIS_MANAGER, REDIS_CONNECTOR } from "@stackra/contracts";
import { getRedisConnectionToken } from "@/decorators/get-redis-connection-token.util";

// Mock dependencies that pull in react
vi.mock("@stackra/ts-cache", () => ({
  CacheStore: () => (target: any) => target,
}));

vi.mock("react", () => ({
  useMemo: (fn: any) => fn(),
  useEffect: () => {},
  useRef: (v: any) => ({ current: v }),
}));

vi.mock("@stackra/ts-container/react", () => ({
  useInject: () => ({}),
}));

vi.mock("@stackra/ts-logger", () => ({
  Logger: class {
    info() {}
    warn() {}
    error() {}
  },
}));

// Mock env to control hasCredentials
vi.mock("@stackra/ts-support", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    env: vi.fn().mockImplementation((key: string, defaultValue?: any) => {
      if (key === "VITE_UPSTASH_REDIS_REST_URL") return "https://test.upstash.io";
      if (key === "VITE_UPSTASH_REDIS_REST_TOKEN") return "test-token";
      return defaultValue;
    }),
  };
});

import { RedisModule } from "@/redis.module";
import { RedisManager } from "@/services/redis-manager.service";

describe("RedisModule.forRoot() — DI Bootstrap", () => {
  const config = {
    default: "cache",
    connections: {
      cache: { url: "https://cache.upstash.io", token: "cache-token" },
      session: { url: "https://session.upstash.io", token: "session-token" },
    },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Module structure
  // ══════════════════════════════════════════════════════════════════════════

  describe("module structure", () => {
    it("returns a DynamicModule with the correct module class", () => {
      const result = RedisModule.forRoot(config as any);
      expect(result.module).toBe(RedisModule);
    });

    it("is global", () => {
      const result = RedisModule.forRoot(config as any);
      expect(result.global).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Provider registration
  // ══════════════════════════════════════════════════════════════════════════

  describe("provider registration", () => {
    it("registers REDIS_CONFIG with the provided config", () => {
      const result = RedisModule.forRoot(config as any);
      const configProvider = result.providers!.find((p: any) => p.provide === REDIS_CONFIG) as any;

      expect(configProvider).toBeDefined();
      expect(configProvider.useValue).toEqual(config);
    });

    it("registers RedisManager", () => {
      const result = RedisModule.forRoot(config as any);
      const managerProvider = result.providers!.find(
        (p: any) => p.provide === RedisManager || p.useClass === RedisManager,
      );

      expect(managerProvider).toBeDefined();
    });

    it("registers REDIS_MANAGER as alias for RedisManager", () => {
      const result = RedisModule.forRoot(config as any);
      const aliasProvider = result.providers!.find((p: any) => p.provide === REDIS_MANAGER) as any;

      expect(aliasProvider).toBeDefined();
      expect(aliasProvider.useExisting).toBe(RedisManager);
    });

    it("registers REDIS_CONNECTOR", () => {
      const result = RedisModule.forRoot(config as any);
      const connectorProvider = result.providers!.find(
        (p: any) => p.provide === REDIS_CONNECTOR,
      ) as any;

      expect(connectorProvider).toBeDefined();
    });

    it("registers per-connection factory providers", () => {
      const result = RedisModule.forRoot(config as any);

      const cacheToken = getRedisConnectionToken("cache");
      const sessionToken = getRedisConnectionToken("session");

      const cacheProvider = result.providers!.find((p: any) => p.provide === cacheToken);
      const sessionProvider = result.providers!.find((p: any) => p.provide === sessionToken);

      expect(cacheProvider).toBeDefined();
      expect(sessionProvider).toBeDefined();
    });

    it("registers default connection token", () => {
      const result = RedisModule.forRoot(config as any);
      const defaultToken = getRedisConnectionToken();

      const defaultProvider = result.providers!.find((p: any) => p.provide === defaultToken);

      expect(defaultProvider).toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Exports
  // ══════════════════════════════════════════════════════════════════════════

  describe("exports", () => {
    it("exports RedisManager", () => {
      const result = RedisModule.forRoot(config as any);
      expect(result.exports).toContain(RedisManager);
    });

    it("exports REDIS_MANAGER token", () => {
      const result = RedisModule.forRoot(config as any);
      expect(result.exports).toContain(REDIS_MANAGER);
    });

    it("exports connection tokens", () => {
      const result = RedisModule.forRoot(config as any);
      expect(result.exports).toContain(getRedisConnectionToken());
      expect(result.exports).toContain(getRedisConnectionToken("cache"));
      expect(result.exports).toContain(getRedisConnectionToken("session"));
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Credential guard
  // ══════════════════════════════════════════════════════════════════════════

  describe("credential guard", () => {
    it("hasCredentials returns true when env vars are set", () => {
      expect(RedisModule.hasCredentials()).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // forRootAsync
  // ══════════════════════════════════════════════════════════════════════════

  describe("forRootAsync", () => {
    it("registers config via useFactory", () => {
      const factory = vi.fn().mockReturnValue(config);
      const result = RedisModule.forRootAsync({
        useFactory: factory,
        inject: [],
      });

      const configProvider = result.providers!.find((p: any) => p.provide === REDIS_CONFIG) as any;

      expect(configProvider).toBeDefined();
      expect(configProvider.useFactory).toBe(factory);
    });

    it("returns empty module when no factory provided", () => {
      const result = RedisModule.forRootAsync({} as any);
      expect(result.providers).toEqual([]);
    });
  });
});
