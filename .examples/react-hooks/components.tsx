/**
 * React Hooks — Component Examples
 *
 * Demonstrates using useRedis and useRedisConnection hooks
 * inside React components for client-side Redis operations.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRedis, useRedisConnection } from '@stackra/ts-redis';
import type { RedisConnection } from '@stackra/ts-redis';

// ============================================================================
// 1. useRedis — Access the RedisManager directly
// ============================================================================

/**
 * Page view counter using the useRedis hook.
 * Accesses the RedisManager and works with the default connection.
 */
function PageViewCounter({ pageId }: { pageId: string }) {
  const redis = useRedis();
  const [views, setViews] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function trackView() {
      const conn = await redis.connection();
      const count = await conn.incr(`page:${pageId}:views`);
      if (!cancelled) setViews(count);
    }

    trackView();
    return () => {
      cancelled = true;
    };
  }, [redis, pageId]);

  return <p>Views: {views}</p>;
}

// ============================================================================
// 2. useRedisConnection — Get a specific named connection
// ============================================================================

/**
 * Displays a cached user profile using the useRedisConnection hook.
 * Resolves the 'cache' connection by name.
 */
function UserProfile({ userId }: { userId: string }) {
  const cachePromise = useRedisConnection('cache');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const cache = await cachePromise;
      const raw = await cache.get(`user:${userId}`);

      if (!cancelled) {
        setUser(raw ? JSON.parse(raw) : null);
        setLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [cachePromise, userId]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>User not found</p>;

  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// ============================================================================
// 3. useRedis — Switching between connections
// ============================================================================

/**
 * Connection status dashboard.
 * Uses the RedisManager to inspect active connections.
 */
function ConnectionDashboard() {
  const redis = useRedis();
  const [status, setStatus] = useState<{
    configured: string[];
    active: string[];
    defaultName: string;
  }>({ configured: [], active: [], defaultName: '' });

  useEffect(() => {
    setStatus({
      configured: redis.getConnectionNames(),
      active: redis.getActiveConnectionNames(),
      defaultName: redis.getDefaultConnectionName(),
    });
  }, [redis]);

  return (
    <div>
      <p>Default: {status.defaultName}</p>
      <p>Configured: {status.configured.join(', ')}</p>
      <p>Active: {status.active.join(', ') || 'none'}</p>
    </div>
  );
}

// ============================================================================
// 4. useRedis — CRUD form with cache write-through
// ============================================================================

/**
 * Simple key-value editor that reads/writes to Redis.
 */
function KeyValueEditor() {
  const redis = useRedis();
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [conn, setConn] = useState<RedisConnection | null>(null);

  // Resolve connection once
  useEffect(() => {
    redis.connection('cache').then(setConn);
  }, [redis]);

  const handleGet = useCallback(async () => {
    if (!conn || !key) return;
    const data = await conn.get(key);
    setResult(data);
  }, [conn, key]);

  const handleSet = useCallback(async () => {
    if (!conn || !key) return;
    await conn.set(key, value, { ex: 3600 });
    setResult('OK — saved with 1h TTL');
  }, [conn, key, value]);

  const handleDelete = useCallback(async () => {
    if (!conn || !key) return;
    const deleted = await conn.del(key);
    setResult(deleted > 0 ? 'Deleted' : 'Key not found');
  }, [conn, key]);

  return (
    <div>
      <input placeholder="Key" value={key} onChange={(e) => setKey(e.target.value)} />
      <input placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={handleGet}>GET</button>
      <button onClick={handleSet}>SET</button>
      <button onClick={handleDelete}>DEL</button>
      {result !== null && <pre>{result}</pre>}
    </div>
  );
}

// ============================================================================
// 5. useRedisConnection — Pipeline batch operations
// ============================================================================

/**
 * Batch loader that uses pipelines for efficient multi-key reads.
 */
function BatchProductLoader({ productIds }: { productIds: string[] }) {
  const cachePromise = useRedisConnection('cache');
  const [products, setProducts] = useState<(string | null)[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      const cache = await cachePromise;

      // Use mget for efficient batch reads
      const results = await cache.mget(...productIds.map((id) => `product:${id}`));
      if (!cancelled) setProducts(results);
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [cachePromise, productIds]);

  return (
    <ul>
      {products.map((p, i) => (
        <li key={productIds[i]}>{p ? JSON.parse(p).name : 'Not cached'}</li>
      ))}
    </ul>
  );
}

export { PageViewCounter, UserProfile, ConnectionDashboard, KeyValueEditor, BatchProductLoader };
