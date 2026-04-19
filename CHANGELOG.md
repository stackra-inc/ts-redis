# Changelog

All notable changes to @stackra/ts-redis will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.6] - 2026-04-20

### Changed

- 🏢 Org rename — migrated scope from `@stackra-inc` → `@stackra` across package
  name, peer dependencies, CI secrets, examples, facades, and steering docs
- 🔧 Standardized CI/CD workflows
- 📝 Updated steering files and documentation

## [1.1.5] - 2026-04-19

### Added

- Standalone GitHub repository at `stackra-inc/ts-redis`
- CI workflow (typecheck, build, lint, format, test) — all green
- Publish workflow with npm provenance and GitHub Releases
- `pnpm-lock.yaml` for reproducible CI installs
- Test mocks for `@stackra/ts-support` and `@stackra/ts-container` peer deps
- `RedisFacade` typed proxy for DI container access

### Fixed

- Removed phantom `connection.base` export (file did not exist)
- Fixed test import path (`redis.service` → `redis-manager.service`)
- Fixed wrong `@module` tag in `use-redis-connection/index.ts`
- Pinned eslint to v9 for `@nesvel/eslint-config` compatibility
- Added `eslint-plugin-turbo` and `jiti` to devDependencies
- Changed `@stackra/ts-support` peer dep from `workspace:*` to `^2.0.0`
- Fixed duplicate banner section in README

### Changed

- Added explicit `public` access modifiers to all public methods
- Replaced `@packageDocumentation` with `@module` tags across all files
- Replaced `export *` with named exports in all barrel `index.ts` files
- Added `@fileoverview`, `@module`, and section headers to all barrels
- Enhanced `IRedisService` interface with `@param`, `@returns` on all methods
- Enhanced `tokens.constant.ts` with `@example` injection patterns
- Excluded `.examples/`, `__tests__/`, and `config/` from eslint
- Updated repository URL from `react-redis` to `ts-redis`

## [1.1.4] - 2026-04-18

### Fixed

- Removed phantom `connection.base` export from `src/connections/index.ts`
- Fixed test import path from `@/services/redis.service` to
  `@/services/redis-manager.service`

### Changed

- Applied @stackra coding standards across all source files
- Added explicit `public` access modifiers
- Replaced `@packageDocumentation` with `@module` tags

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
- `UpstashConnection` implementation for Upstash Redis HTTP client
- `UpstashConnector` for creating Upstash connections
- Pipeline, pub/sub, sorted sets, Lua scripting
- Retry configuration with exponential backoff

## [Unreleased]

### Planned

- Connection health checks
- Metrics and monitoring hooks
- Advanced caching patterns
- Cache invalidation strategies
