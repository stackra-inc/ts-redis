# @stackra/ts-redis — Examples

## Examples

### 1. `basic-usage/`

Single-connection setup covering all core Redis operations:

- Module registration with `RedisModule.forRoot()`
- `defineConfig()` for type-safe configuration
- GET / SET / DEL / EXISTS with TTL options (ex, px, nx, xx)
- Atomic counters (INCR, INCRBY, DECR, DECRBY)
- Multi-key operations (MGET, MSET)
- Sorted sets (ZADD, ZRANGE, ZREM, ZREMRANGEBYSCORE)
- Lua script execution (EVAL)

### 2. `multiple-connections/`

Multi-connection setup with advanced patterns:

- Multiple named connections (cache, session, ratelimit)
- Per-connection retry policies and timeouts
- Pipeline operations for batching commands
- Connection introspection (list, check active, switch default)
- Disconnect and cleanup lifecycle
- Injectable service pattern with DI (`@Inject(RedisManager)`)

### 3. `react-hooks/`

React integration using `useRedis` and `useRedisConnection`:

- `useRedis()` — access the RedisManager in components
- `useRedisConnection(name)` — resolve a named connection
- Page view counter (INCR)
- Cached user profile loader
- Connection status dashboard
- Key-value CRUD editor
- Batch product loader with MGET

## Setup

1. Install dependencies:

```bash
pnpm add @stackra/ts-redis @stackra/ts-container @stackra/ts-support @upstash/redis
```

2. Set environment variables in your `.env`:

```env
VITE_UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=your-token-here
```

3. Copy the example config and module into your project and adapt as needed.
