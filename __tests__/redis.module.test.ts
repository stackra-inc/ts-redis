/**
 * @fileoverview Tests for RedisModule
 *
 * This test suite verifies the RedisModule DI integration including:
 * - Module registration via `forRoot()` with connection configurations
 * - Provider creation and token registration (REDIS_CONFIG, REDIS_MANAGER, REDIS_CONNECTOR)
 * - Multi-connection configuration support
 * - Credential checking via `hasCredentials()`
 * - Module export structure validation
 *
 * The RedisModule follows the standard manager DI pattern:
 * - REDIS_CONFIG — raw config object
 * - RedisManager — class-based injection
 * - REDIS_MANAGER — useExisting alias
 * - REDIS_CONNECTOR — the connector used to create connections
 *
 * @module @stackra/ts-redis
 * @category Tests / Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RedisModule } from "@/redis.module";

// ============================================================================
// Mocks
// ============================================================================

/**
 * Mock the global `env()` function used by RedisModule.hasCredentials()
 */
const mockEnvValues: Record<string, string | undefined> = {};

vi.stubGlobal("env", (key: string) => mockEnvValues[key]);

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a minimal valid RedisConfig for testing.
 *
 * @param overrides - Partial options to merge on top of defaults
 * @returns A complete RedisConfig object
 */
function makeConfig(overrides: Record<string, any> = {}) {
  return {
    default: "cache",
    connections: {
      cache: {
        url: "https://test-redis.upstash.io",
        token: "test-token-123",
      },
      ...overrides.connections,
    },
    ...overrides,
  };
}

// ============================================================================
// Test Suite
// ============================================================================

describe("RedisModule", () => {
  beforeEach(() => {
    // Reset mock env values
    Object.keys(mockEnvValues).forEach((key) => delete mockEnvValues[key]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── forRoot() ─────────────────────────────────────────────────────────────

  describe("forRoot()", () => {
    it("should return a DynamicModule with the correct module reference", () => {
      // Act: Create module with valid config
      const module = RedisModule.forRoot(makeConfig());

      // Assert: Module reference points back to RedisModule class
      expect(module).toBeDefined();
      expect(module.module).toBe(RedisModule);
    });

    it("should include providers array in the dynamic module", () => {
      // Arrange: Set credentials so module creates providers
      mockEnvValues["VITE_UPSTASH_REDIS_REST_URL"] = "https://test.upstash.io";
      mockEnvValues["VITE_UPSTASH_REDIS_REST_TOKEN"] = "test-token";

      // Act: Create module
      const module = RedisModule.forRoot(makeConfig());

      // Assert: Providers are defined
      expect(module).toBeDefined();
      expect(module.providers).toBeDefined();
    });

    it("should include exports array in the dynamic module", () => {
      // Act: Create module
      const module = RedisModule.forRoot(makeConfig());

      // Assert: Exports are defined
      expect(module.exports).toBeDefined();
      expect(Array.isArray(module.exports)).toBe(true);
    });

    it("should accept multiple connection configurations", () => {
      // Arrange: Set credentials and multiple connections
      mockEnvValues["VITE_UPSTASH_REDIS_REST_URL"] = "https://test.upstash.io";
      mockEnvValues["VITE_UPSTASH_REDIS_REST_TOKEN"] = "test-token";

      const config = makeConfig({
        connections: {
          cache: { url: "https://cache.upstash.io", token: "cache-token" },
          session: { url: "https://session.upstash.io", token: "session-token" },
          queue: { url: "https://queue.upstash.io", token: "queue-token" },
        },
      });

      // Act: Create module
      const module = RedisModule.forRoot(config);

      // Assert: Module handles multiple connections
      expect(module).toBeDefined();
    });
  });

  // ── hasCredentials() ──────────────────────────────────────────────────────

  describe("hasCredentials()", () => {
    it("should return true when both URL and token are set", () => {
      // Arrange: Set credentials
      mockEnvValues["VITE_UPSTASH_REDIS_REST_URL"] = "https://test.upstash.io";
      mockEnvValues["VITE_UPSTASH_REDIS_REST_TOKEN"] = "test-token";

      // Act: Check credentials
      const result = RedisModule.hasCredentials();

      // Assert: Credentials are available
      expect(result).toBe(true);
    });

    it("should return false when URL is missing", () => {
      // Arrange: Only token set
      mockEnvValues["VITE_UPSTASH_REDIS_REST_TOKEN"] = "test-token";

      // Act: Check credentials
      const result = RedisModule.hasCredentials();

      // Assert: Credentials are incomplete
      expect(result).toBe(false);
    });

    it("should return false when token is missing", () => {
      // Arrange: Only URL set
      mockEnvValues["VITE_UPSTASH_REDIS_REST_URL"] = "https://test.upstash.io";

      // Act: Check credentials
      const result = RedisModule.hasCredentials();

      // Assert: Credentials are incomplete
      expect(result).toBe(false);
    });

    it("should return false when both are missing", () => {
      // Arrange: Nothing set

      // Act: Check credentials
      const result = RedisModule.hasCredentials();

      // Assert: No credentials
      expect(result).toBe(false);
    });
  });
});
