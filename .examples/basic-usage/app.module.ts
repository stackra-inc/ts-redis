/**
 * Basic Usage — App Module
 *
 * Demonstrates how to register the RedisModule with a single connection
 * and perform basic CRUD operations.
 */

import { Module } from '@stackra/ts-container';
import { RedisModule, RedisManager } from '@stackra/ts-redis';
import redisConfig from './redis.config';

// ============================================================================
// 1. Register the module
// ============================================================================

@Module({
  imports: [RedisModule.forRoot(redisConfig)],
})
class AppModule {}

// ============================================================================
// 2. Basic CRUD operations
// ============================================================================

async function basicCrudExample(redis: RedisManager) {
  const conn = await redis.connection(); // uses 'main' (default)

  // ── SET / GET ──────────────────────────────────────────────────────────
  await conn.set('greeting', 'Hello, Redis!');
  const greeting = await conn.get('greeting');
  console.log(greeting); // "Hello, Redis!"

  // ── SET with expiration (TTL) ──────────────────────────────────────────
  await conn.set('temp:token', 'abc123', { ex: 300 }); // expires in 5 minutes
  await conn.set('temp:otp', '9999', { px: 30000 }); // expires in 30 seconds (ms)

  const ttl = await conn.ttl('temp:token');
  console.log(`Token expires in ${ttl}s`);

  // ── Conditional SET ────────────────────────────────────────────────────
  // NX — only set if key does NOT exist (distributed lock pattern)
  const lockAcquired = await conn.set('lock:resource', 'owner-1', { nx: true });
  console.log(lockAcquired); // "OK" or null

  // XX — only set if key already exists (update pattern)
  await conn.set('greeting', 'Updated!', { xx: true });

  // ── EXISTS / DEL ───────────────────────────────────────────────────────
  const exists = await conn.exists('greeting');
  console.log(`Key exists: ${exists > 0}`);

  const deleted = await conn.del('greeting', 'temp:token');
  console.log(`Deleted ${deleted} keys`);

  // ── INCR / DECR (atomic counters) ─────────────────────────────────────
  await conn.set('counter', '0');
  await conn.incr('counter'); // 1
  await conn.incrby('counter', 10); // 11
  await conn.decr('counter'); // 10
  await conn.decrby('counter', 5); // 5

  const count = await conn.get('counter');
  console.log(`Counter: ${count}`); // "5"

  // ── Multi-key operations ──────────────────────────────────────────────
  await conn.mset({
    'user:1': JSON.stringify({ name: 'Alice' }),
    'user:2': JSON.stringify({ name: 'Bob' }),
    'user:3': JSON.stringify({ name: 'Charlie' }),
  });

  const [user1, user2, user3] = await conn.mget('user:1', 'user:2', 'user:3');
  console.log(user1, user2, user3);

  // ── Cleanup ────────────────────────────────────────────────────────────
  await conn.del('counter', 'user:1', 'user:2', 'user:3', 'lock:resource');
}

// ============================================================================
// 3. Sorted set operations (useful for leaderboards, TTL tracking)
// ============================================================================

async function sortedSetExample(redis: RedisManager) {
  const conn = await redis.connection();

  // Add scores to a leaderboard
  await conn.zadd('leaderboard', 100, 'alice');
  await conn.zadd('leaderboard', 250, 'bob');
  await conn.zadd('leaderboard', 175, 'charlie');

  // Get all members (sorted by score ascending)
  const members = await conn.zrange('leaderboard', 0, -1);
  console.log('Leaderboard:', members); // ["alice", "charlie", "bob"]

  // Remove a member
  await conn.zrem('leaderboard', 'charlie');

  // Remove members with scores below a threshold
  await conn.zremrangebyscore('leaderboard', 0, 150);

  // Cleanup
  await conn.del('leaderboard');
}

// ============================================================================
// 4. Lua script execution (atomic operations)
// ============================================================================

async function luaScriptExample(redis: RedisManager) {
  const conn = await redis.connection();

  // Atomic "get-and-increment" using Lua
  const script = `
    local current = redis.call('GET', KEYS[1])
    if current then
      return redis.call('INCRBY', KEYS[1], ARGV[1])
    else
      redis.call('SET', KEYS[1], ARGV[1])
      return tonumber(ARGV[1])
    end
  `;

  await conn.set('lua:counter', '10');
  const result = await conn.eval(script, ['lua:counter'], [5]);
  console.log('Lua result:', result); // 15

  await conn.del('lua:counter');
}

export { AppModule, basicCrudExample, sortedSetExample, luaScriptExample };
