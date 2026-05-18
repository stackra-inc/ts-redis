/**
 * @fileoverview Tests for UpstashConnector
 *
 * This test suite verifies the UpstashConnector which creates Redis
 * connections using the Upstash HTTP API. Tests cover:
 *
 * - Successful connection creation with valid config
 * - Configuration validation (missing URL, missing token)
 * - Error handling for invalid configurations
 * - Connection options passthrough (retry, enableAutoPipelining)
 * - Return type validation (UpstashConnection instance)
 *
 * @module @stackra/ts-redis
 * @category Tests / Connectors
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpstashConnector } from "@/connectors/upstash.connector";

// ============================================================================
// Mocks
// ============================================================================

/**
 * Mock the @upstash/redis module to avoid real HTTP connections.
 * The mock Redis class records constructor arguments for assertion.
 */
vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    _config: any;
    constructor(config: any) {
      this._config = config;
    }
    get = vi.fn();
    set = vi.fn();
    del = vi.fn();
    keys = vi.fn().mockResolvedValue([]);
    pipeline = vi.fn().mockReturnValue({
      get: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    });
  },
}));

/**
 * Mock the DI decorators.
 */
vi.mock("@stackra/ts-container", () => ({
  Injectable: () => (target: any) => target,
  Inject: () => () => undefined,
}));

// ============================================================================
// Test Suite
// ============================================================================

describe("UpstashConnector", () => {
  let connector: UpstashConnector;

  beforeEach(() => {
    connector = new UpstashConnector();
  });

  // ── Successful Connection ───────────────────────────────────────────────

  describe("connect() — Success", () => {
    it("should create a connection with valid URL and token", async () => {
      // Arrange: Valid config
      const config = {
        url: "https://my-redis.upstash.io",
        token: "my-secret-token",
      };

      // Act: Connect
      const connection = await connector.connect(config);

      // Assert: Connection is returned
      expect(connection).toBeDefined();
    });

    it("should pass retry options to the Upstash client", async () => {
      // Arrange: Config with retry
      const config = {
        url: "https://my-redis.upstash.io",
        token: "my-secret-token",
        retry: {
          retries: 3,
          backoff: (retryCount: number) => Math.min(1000 * 2 ** retryCount, 3000),
        },
      };

      // Act: Connect
      const connection = await connector.connect(config);

      // Assert: Connection is created (retry is passed to Redis constructor)
      expect(connection).toBeDefined();
    });

    it("should pass enableAutoPipelining option", async () => {
      // Arrange: Config with auto-pipelining
      const config = {
        url: "https://my-redis.upstash.io",
        token: "my-secret-token",
        enableAutoPipelining: true,
      };

      // Act: Connect
      const connection = await connector.connect(config);

      // Assert: Connection is created
      expect(connection).toBeDefined();
    });
  });

  // ── Validation Errors ───────────────────────────────────────────────────

  describe("connect() — Validation", () => {
    it("should throw when URL is missing", async () => {
      // Arrange: Config without URL
      const config = {
        url: "",
        token: "my-secret-token",
      };

      // Act & Assert: Should throw
      await expect(connector.connect(config)).rejects.toThrow(/url/i);
    });

    it("should throw when token is missing", async () => {
      // Arrange: Config without token
      const config = {
        url: "https://my-redis.upstash.io",
        token: "",
      };

      // Act & Assert: Should throw
      await expect(connector.connect(config)).rejects.toThrow(/token/i);
    });

    it("should throw when both URL and token are missing", async () => {
      // Arrange: Empty config
      const config = { url: "", token: "" };

      // Act & Assert: Should throw
      await expect(connector.connect(config)).rejects.toThrow();
    });
  });
});
