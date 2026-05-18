<p align="center">
  <a href="https://www.npmjs.com/package/@stackra/ts-redis">
    <img src="https://img.shields.io/npm/v/@stackra/ts-redis?style=flat-square&color=38bdf8&label=npm" alt="npm version" />
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-818cf8?style=flat-square" alt="MIT license" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-6.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
</p>

# @stackra/ts-redis

Client-side Redis connection management using the Upstash HTTP API.
Browser-safe, multi-connection, and DI-first.

## Features

- Multiple named connections with a configurable default
- Upstash HTTP driver — no TCP, no Node.js required, works in the browser
- Static `forRoot()` and dynamic `forRootAsync()` module configuration
- Credential detection via `VITE_UPSTASH_REDIS_REST_URL` /
  `VITE_UPSTASH_REDIS_REST_TOKEN` — skips registration with a warning when
  missing
- DI decorators: `@InjectRedis(name?)`, `@InjectRedisManager()`
- React hooks: `useRedis`, `useRedisConnection`
- Typed pipelines, set options, and subscriber events

## Install

```bash
pnpm add @stackra/ts-redis
```

### Peer Dependencies

Required:

- `@stackra/ts-container` — DI module, `@Module`, `@Injectable`, `@Inject`
- `@stackra/ts-support` — `MultipleInstanceManager`, `Facade`, `GlobalRegistry`

Optional:

- `@stackra/ts-logger` — enables structured logging
- `react` ^19.2.5 — required only for `useRedis` / `useRedisConnection`

## Quick Start

### 1. Register the module

```typescript
import { Module } from "@stackra/ts-container";
import { RedisModule } from "@stackra/ts-redis";

@Module({
  imports: [
    RedisModule.forRoot({
      default: "cache",
      connections: {
        cache: {
          url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL,
          token: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN,
        },
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Inject and use

```typescript
import { Injectable } from "@stackra/ts-container";
import { InjectRedis, type RedisConnection } from "@stackra/ts-redis";

@Injectable()
export class SessionService {
  constructor(@InjectRedis() private redis: RedisConnection) {}

  async save(sessionId: string, data: object) {
    await this.redis.set(`session:${sessionId}`, JSON.stringify(data), {
      ex: 3600,
    });
  }
}
```

## Configuration

`RedisModule.forRoot(config)` accepts a `RedisConfig` with named connections:

```typescript
RedisModule.forRoot({
  default: "cache",
  connections: {
    cache: { url: "...", token: "..." },
    session: { url: "...", token: "..." },
  },
  isGlobal: true,
});
```

Use `RedisModule.forRootAsync(options)` to resolve credentials from another
module (e.g., `ConfigModule`):

```typescript
RedisModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (cfg: ConfigService) => ({
    default: "cache",
    connections: {
      cache: {
        url: cfg.getString("UPSTASH_REDIS_REST_URL"),
        token: cfg.getString("UPSTASH_REDIS_REST_TOKEN"),
      },
    },
  }),
  inject: [ConfigService],
});
```

### Credential Gating

`RedisModule.hasCredentials()` checks for `VITE_UPSTASH_REDIS_REST_URL` and
`VITE_UPSTASH_REDIS_REST_TOKEN`. When either is missing, `forRoot()` returns an
empty module and logs a warning. Downstream packages (cache, events, realtime)
detect the absence via `@Optional() @Inject(REDIS_MANAGER)`.

## Core Concepts

### RedisManager

`RedisManager` extends `MultipleInstanceManager<RedisConnection>` and implements
`IRedisService`. It resolves each configured connection lazily through
`UpstashConnector`, caches the resulting `UpstashConnection`, and exposes it
through `manager.connection(name)`.

### UpstashConnection

Wraps `@upstash/redis` with typed commands (`get`, `set`, `del`, `incr`,
pipelines) plus a subscriber interface with events for messages, pattern
messages, and subscription counts.

## API

### Services

- `RedisManager` — multi-connection orchestrator, implements `IRedisService`

### Connectors / Connections

- `UpstashConnector` — factory producing `UpstashConnection` instances
- `UpstashConnection` — typed HTTP-backed Redis client

### Hooks

- `useRedis(name?)` — returns a `RedisConnection` for the named (or default)
  connection
- `useRedisConnection(name?)` — same connection scoped to component lifetime

### Decorators

- `@InjectRedis(name?)` — inject a `RedisConnection`
- `@InjectRedisManager()` — inject the `RedisManager`
- `getRedisConnectionToken(name?)` — resolve the per-connection DI token

### Facades

- `RedisFacade` — static `RedisFacade.connection(name?).get(...)` for use
  outside DI

### Tokens

- `REDIS_CONFIG`, `REDIS_CONNECTOR`, `REDIS_MANAGER`

### Errors

- `RedisError`, `RedisConnectionError`, `RedisConfigError`

## Usage Examples

### Pipeline

```typescript
const pipeline = redis.pipeline();
pipeline.set("counter:a", 1);
pipeline.incr("counter:a");
pipeline.get("counter:a");
const [, , value] = await pipeline.exec();
```

### Pub/Sub

```typescript
const subscriber = redis.subscribe("notifications");
subscriber.on("message", ({ channel, message }) => {
  console.log(channel, message);
});
```

### Multi-connection switching

```typescript
@Injectable()
export class DualStoreService {
  constructor(
    @InjectRedis("cache") private cache: RedisConnection,
    @InjectRedis("session") private session: RedisConnection,
  ) {}
}
```

## Integration with Other Packages

- `@stackra/ts-cache` — consumes `REDIS_MANAGER` for Redis-backed cache stores
- `@stackra/ts-events` — consumes `REDIS_MANAGER` for the Redis pub/sub driver
- `@stackra/ts-realtime` — consumes `REDIS_MANAGER` for the Redis broadcaster
  backend
- `@stackra/ts-logger` — optional structured logger resolved via
  `Symbol.for('LOGGER_MANAGER')`

## Testing

`RedisFacade.swap(manager)` lets tests substitute the manager with a fake. In DI
tests, provide a `useValue` override for `REDIS_MANAGER` or `RedisManager`.

## License

MIT © [Stackra L.L.C](https://github.com/stackra-inc)
