import { describe, it, expect, beforeEach } from 'vitest';
import { UpstashConnector } from '@/connectors/upstash.connector';
import type { RedisConnectionConfig } from '@/interfaces';

describe('UpstashConnector', () => {
  let connector: UpstashConnector;

  beforeEach(() => {
    connector = new UpstashConnector();
  });

  describe('connect', () => {
    it('should create connection with valid config', async () => {
      const config: RedisConnectionConfig = {
        url: 'https://test.upstash.io',
        token: 'test-token',
      };
      const connection = await connector.connect(config);
      expect(connection).toBeDefined();
      expect(typeof connection.get).toBe('function');
      expect(typeof connection.set).toBe('function');
      expect(typeof connection.del).toBe('function');
    });

    it('should create connection with timeout', async () => {
      const config: RedisConnectionConfig = {
        url: 'https://test.upstash.io',
        token: 'test-token',
        timeout: 5000,
      };
      const connection = await connector.connect(config);
      expect(connection).toBeDefined();
    });

    it('should create connection with retry config', async () => {
      const config: RedisConnectionConfig = {
        url: 'https://test.upstash.io',
        token: 'test-token',
        retry: {
          retries: 3,
          backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 3000),
        },
      };
      const connection = await connector.connect(config);
      expect(connection).toBeDefined();
    });
  });
});
