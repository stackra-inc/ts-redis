---
inclusion: always
---

# Facade Pattern Standard

Facades provide static-style access to DI-resolved services. Every package with
an injectable service MUST have a corresponding facade.

## The Pattern

Facades are typed constants created via `Facade.make<T>(token)`:

```typescript
import { Facade } from '@stackra/ts-support';
import { CacheManager } from '../services/cache-manager.service';
import { CACHE_MANAGER } from '../constants/tokens.constant';

export const CacheFacade: CacheManager =
  Facade.make<CacheManager>(CACHE_MANAGER);
```

One line. No class. No boilerplate. The constant IS the typed proxy.

## Rules

1. **One facade per injectable service** — every package's main service gets a
   facade
2. **File location**: `src/facades/{name}.facade.ts`
3. **Barrel export**: `src/facades/index.ts` re-exports all facades
4. **Package index**: facade must be exported from the package's `src/index.ts`
5. **Token choice**: use Symbol tokens (`CACHE_MANAGER`) for services with
   required constructor params; use class tokens (`ConfigManager`) only when the
   class has no required params

## Bootstrap Wiring

Call `Facade.setApplication(app)` once in `main.tsx` after
`Application.create()`:

```typescript
import { Application } from '@stackra/ts-container';
import { Facade } from '@stackra/ts-support';

const app = await Application.create(AppModule);
Facade.setApplication(app); // wires all facades
```

## Usage

```typescript
import { CacheFacade } from '@stackra/ts-cache';

// Full autocomplete — no .proxy() call, no .instance getter
CacheFacade.store().remember('key', 3600, () => fetch());
```

## Testing — Swap in a Mock

```typescript
import { Facade } from '@stackra/ts-support';

// Before test
Facade.swap(CACHE_MANAGER, mockInstance);

// After test
Facade.clearResolvedInstances();
```

## Generation Script

Run `node scripts/generate-facades.mjs` to regenerate all facades. Run
`node scripts/generate-facades.mjs --dry-run` to preview.

## Existing Facades

| Facade           | Package                  | Service                | Token                  |
| ---------------- | ------------------------ | ---------------------- | ---------------------- |
| `CacheFacade`    | `@stackra/ts-cache`      | `CacheManager`         | `CACHE_MANAGER`        |
| `ConfigFacade`   | `@stackra/ts-config`     | `ConfigManager`        | `ConfigManager`        |
| `EventFacade`    | `@stackra/ts-events`     | `EventManager`         | `EVENT_MANAGER`        |
| `HttpFacade`     | `@stackra/ts-http`       | `HttpClient`           | `HTTP_CLIENT`          |
| `ShortcutFacade` | `@stackra/kbd`           | `ShortcutRegistry`     | `ShortcutRegistry`     |
| `LogFacade`      | `@stackra/ts-logger`     | `LoggerManager`        | `LoggerManager`        |
| `RedisFacade`    | `@stackra/ts-redis`      | `RedisManager`         | `RedisManager`         |
| `SettingsFacade` | `@stackra/ts-settings`   | `SettingsStoreManager` | `SettingsStoreManager` |
| `DesktopFacade`  | `@stackra/ts-desktop`    | `DesktopManager`       | `DesktopManager`       |
| `AuthFacade`     | `@stackra/react-auth`    | `AuthService`          | `AUTH_SERVICE`         |
| `RouteFacade`    | `@stackra/react-router`  | `RouteRegistry`        | `ROUTE_REGISTRY`       |
| `ThemeFacade`    | `@stackra/react-theming` | `ThemeRegistry`        | `THEME_REGISTRY`       |
