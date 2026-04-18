import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RedisManager } from '@/services/redis-manager.service';
import type { RedisConfig, RedisConnector, RedisConnection } from '@/interfaces';

describe('RedisManager', () => {
  let redisManager: RedisManager;
  let mockConnector: RedisConnector;
  let mockConnection: RedisConnection;
  let config: RedisConfig;

  beforeEach(() => {
    mockConnection = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      disconnect: vi.fn(),
    } as any;

    mockConnector = {
      connect: vi.fn().mockResolvedValue(mockConnection),
    };

    config = {
      default: 'cache',
      connections: {
        cache: { url: 'https://test.upstash.io', token: 'test-token' },
        session: { url: 'https://session.upstash.io', token: 'session-token' },
      },
    };

    redisManager = new RedisManager(config, mockConnector);
  });

  describe('connection', () => {
    it('should return default connection when no name provided', async () => {
      const connection = await redisManager.connection();
      expect(mockConnector.connect).toHaveBeenCalledWith(
        expect.objectContaining(config.connections.cache)
      );
      expect(connection).toBe(mockConnection);
    });

    it('should return named connection', async () => {
      const connection = await redisManager.connection('session');
      expect(mockConnector.connect).toHaveBeenCalledWith(
        expect.objectContaining(config.connections.session)
      );
      expect(connection).toBe(mockConnection);
    });

    it('should cache connections', async () => {
      const conn1 = await redisManager.connection('cache');
      const conn2 = await redisManager.connection('cache');
      expect(mockConnector.connect).toHaveBeenCalledTimes(1);
      expect(conn1).toBe(conn2);
    });
  });

  describe('disconnect', () => {
    it('should disconnect default connection', async () => {
      await redisManager.connection();
      await redisManager.disconnect();
      expect(mockConnection.disconnect).toHaveBeenCalled();
      expect(redisManager.isConnectionActive()).toBe(false);
    });

    it('should disconnect named connection', async () => {
      await redisManager.connection('session');
      await redisManager.disconnect('session');
      expect(mockConnection.disconnect).toHaveBeenCalled();
      expect(redisManager.isConnectionActive('session')).toBe(false);
    });

    it('should handle disconnect of non-existent connection', async () => {
      await expect(redisManager.disconnect('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('disconnectAll', () => {
    it('should disconnect all connections', async () => {
      await redisManager.connection('cache');
      await redisManager.connection('session');
      await redisManager.disconnectAll();
      expect(mockConnection.disconnect).toHaveBeenCalledTimes(2);
      expect(redisManager.isConnectionActive('cache')).toBe(false);
      expect(redisManager.isConnectionActive('session')).toBe(false);
    });
  });

  describe('getConnectionNames', () => {
    it('should return all configured connection names', () => {
      const names = redisManager.getConnectionNames();
      expect(names).toEqual(['cache', 'session']);
    });
  });

  describe('getDefaultConnectionName', () => {
    it('should return default connection name', () => {
      expect(redisManager.getDefaultConnectionName()).toBe('cache');
    });
  });

  describe('isConnectionActive', () => {
    it('should return false for inactive connection', () => {
      expect(redisManager.isConnectionActive('cache')).toBe(false);
    });

    it('should return true for active connection', async () => {
      await redisManager.connection('cache');
      expect(redisManager.isConnectionActive('cache')).toBe(true);
    });
  });
});
