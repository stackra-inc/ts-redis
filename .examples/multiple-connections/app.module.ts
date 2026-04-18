/**
 * Multiple Connections — App Module
 *
 * Demonstrates using multiple named Redis connections, pipelines,
 * connection introspection, and service injection patterns.
 */

import { Module, Injectable, Inject } from '@stackra/ts-container';
import { RedisModule, RedisManager } from '@stackra/ts-redis';
import redisConfig from './redis.config';

// ============================================================================
// 1. Register the module with multiple connections
// ============================================================================

@Module({
  imports: [RedisModule.forRoot(redisConfig)],
})
class AppModule {}

// ============================================================================
// 2. Using named connections
// ============================================================================

async function multiConnectionExample(redis: RedisManager) {
  // Default connection (cache)
  const cache = await redis.connection();
  await cache.set('product:42', JSON.stringify({ name: 'Widget', price: 9.99 }), { ex: 3600 });

  // Explicit session connection
  const session = await redis.connection('session');
  await session.set('sess:abc123', JSON.stringify({ userId: 1, role: 'admin' }), { ex: 86400 });

  // Rate-limit connection
  const ratelimit = await redis.connection('ratelimit');
  const requests = await ratelimit.incr('rate:user:1:minute');
  console.log(`Requests this minute: ${requests}`);
  if (requests === 1) {
    await ratelimit.expire('rate:user:1:minute', 60);
  }
}

// ============================================================================
// 3. Pipeline operations (batch multiple commands in one HTTP request)
// ============================================================================

async function pipelineExample(redis: RedisManager) {
  const conn = await redis.connection('cache');

  // Batch writes — single HTTP round-trip
  const results = await conn
    .pipeline()
    .set('item:1', JSON.stringify({ name: 'Apple' }), { ex: 600 })
    .set('item:2', JSON.stringify({ name: 'Banana' }), { ex: 600 })
    .set('item:3', JSON.stringify({ name: 'Cherry' }), { ex: 600 })
    .exec();

  console.log('Pipeline results:', results); // ["OK", "OK", "OK"]

  // Batch reads
  const readResults = await conn.pipeline().get('item:1').get('item:2').get('item:3').exec();

  console.log('Read results:', readResults);

  // Mixed operations
  await conn
    .pipeline()
    .set('counter:page', '0')
    .del('old:key1', 'old:key2')
    .get('counter:page')
    .exec();
}

// ============================================================================
// 4. Connection introspection
// ============================================================================

async function introspectionExample(redis: RedisManager) {
  // List all configured connection names
  const names = redis.getConnectionNames();
  console.log('Configured connections:', names); // ["cache", "session", "ratelimit"]

  // Check the default
  console.log('Default:', redis.getDefaultConnectionName()); // "cache"

  // Warm a connection
  await redis.connection('session');

  // Check which connections are active (resolved & cached)
  console.log('Active:', redis.getActiveConnectionNames()); // includes "session"
  console.log('Session active:', redis.isConnectionActive('session')); // true
  console.log('Ratelimit active:', redis.isConnectionActive('ratelimit')); // false

  // Switch the default at runtime
  redis.setDefaultInstance('session');
  const conn = await redis.connection(); // now returns the session connection
  console.log('Now using:', conn.getName());
}

// ============================================================================
// 5. Disconnect & cleanup
// ============================================================================

async function disconnectExample(redis: RedisManager) {
  // Disconnect a single connection
  await redis.disconnect('session');
  console.log('Session active:', redis.isConnectionActive('session')); // false

  // Disconnect everything
  await redis.disconnectAll();
  console.log('Active after purge:', redis.getActiveConnectionNames()); // []
}

// ============================================================================
// 6. Injectable service pattern (DI)
// ============================================================================

@Injectable()
class ProductCacheService {
  constructor(@Inject(RedisManager) private readonly redis: RedisManager) {}

  async getProduct(id: string) {
    const conn = await this.redis.connection('cache');
    const raw = await conn.get(`product:${id}`);
    return raw ? JSON.parse(raw) : null;
  }

  async setProduct(id: string, data: Record<string, unknown>, ttl = 3600) {
    const conn = await this.redis.connection('cache');
    await conn.set(`product:${id}`, JSON.stringify(data), { ex: ttl });
  }

  async invalidateProduct(id: string) {
    const conn = await this.redis.connection('cache');
    await conn.del(`product:${id}`);
  }
}

@Injectable()
class SessionService {
  constructor(@Inject(RedisManager) private readonly redis: RedisManager) {}

  async getSession(sessionId: string) {
    const conn = await this.redis.connection('session');
    const raw = await conn.get(`sess:${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  }

  async createSession(sessionId: string, data: Record<string, unknown>) {
    const conn = await this.redis.connection('session');
    await conn.set(`sess:${sessionId}`, JSON.stringify(data), { ex: 86400 });
  }

  async destroySession(sessionId: string) {
    const conn = await this.redis.connection('session');
    await conn.del(`sess:${sessionId}`);
  }
}
