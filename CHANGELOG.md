# Changelog

All notable changes to @stackra/ts-redis will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] - 2026-04-18

### Fixed

- Removed phantom `connection.base` export from `src/connections/index.ts` (file
  did not exist)
- Fixed test import path from non-existent `@/services/redis.service` to
  `@/services/redis-manager.service`
- Fixed wrong `@module` tag in `use-redis-connection/index.ts`
  (`hooks/use-redis` → `hooks/use-redis-connection`)

### Changed

- Added explicit `public` access modifiers to all public methods in
  `UpstashConnection`, `UpstashConnector`, `RedisManager`, and `RedisModule`
- Replaced `@packageDocumentation` with `@module` tags across all source files
- Replaced `export *` with named exports in all barrel `index.ts` files
- Added `@fileoverview`, `@module`, and section headers to all barrel exports
- Enhanced `IRedisService` interface with `@param`, `@returns` on all methods
- Enhanced `tokens.constant.ts` with `@example` injection patterns on all tokens
- Added `@returns` tags to all `RedisManager` public methods
- Updated repository URL from `react-redis` to `ts-redis`

## [1.0.4] - 2026-04-05

### Fixed

- Replaced `forRoot` helper with inline `DynamicModule` object in
  `RedisModule.forRoot()` for compatibility with `@stackra/ts-container` v2
- Providers now correctly respect `isGlobal` flag per-provider

### Added

- `isGlobal` option to `RedisConfig` — controls whether Redis providers are
  registered globally (defaults to `true`)

## [1.0.0] - 2024-01-XX

### Added

- Initial release of @stackra/ts-redis
- Browser-compatible Redis operations using Upstash HTTP API
- `RedisService` for connection management
- `RedisModule` for dependency injection configuration
- Support for multiple named connections
- React hooks: `useRedis()` and `useRedisConnection()`
- Comprehensive TypeScript types and JSDoc documentation
- Connection interfaces: `RedisConnection`, `RedisConnector`
- Configuration interfaces: `RedisConfig`, `RedisConnectionConfig`
- `UpstashConnection` implementation for Upstash Redis HTTP client
- `UpstashConnector` for creating Upstash connections
- Pipeline support for batching operations
- Retry configuration with exponential backoff
- Timeout configuration for requests
- Auto-pipelining support
- Complete Redis operations:
  - Basic key-value operations (get, set, del, exists, expire, ttl)
  - Multi-key operations (mget, mset)
  - Increment/decrement operations (incr, incrby, decr, decrby)
  - Sorted set operations (zadd, zrange, zrem, zremrangebyscore)
  - Lua script execution (eval)
  - Pipeline operations for batching
  - Maintenance operations (flushdb, disconnect)

### Documentation

- Comprehensive README with quick start guide
- API reference documentation
- Common patterns and best practices
- Browser compatibility information
- TypeScript usage examples
- React hooks examples
- Multiple connection configuration examples
- EXAMPLES.md with detailed usage scenarios

### Features

- ✅ Browser-compatible (no Node.js required)
- ✅ Multiple named connections
- ✅ Dependency injection support
- ✅ React hooks
- ✅ Full TypeScript support
- ✅ Production-ready error handling
- ✅ Automatic retries with backoff
- ✅ Request timeouts
- ✅ Pipeline support for performance
- ✅ Lazy connection initialization
- ✅ Connection caching and reuse
- ✅ Graceful cleanup

## [Unreleased]

### Planned

- Connection health checks
- Metrics and monitoring hooks
- Advanced caching patterns
- Cache invalidation strategies
- Distributed lock improvements
- Rate limiting utilities
- Session management utilities
- Integration with @stackra/cache package
