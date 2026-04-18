---
inclusion: auto
---

# TypeScript Container Architecture

## Overview

`@stackra/ts-container` is a NestJS-style IoC container and dependency injection
system for client-side TypeScript applications. It provides a complete DI system
with decorators, module system, lifecycle hooks, and React integration.

## Core Concepts

### 1. Dependency Injection (DI)

Classes are marked with `@Injectable()` and dependencies are resolved
automatically:

```typescript
@Injectable()
class UserService {
  constructor(
    private logger: LoggerService,
    @Inject('API_URL') private apiUrl: string,
    @Optional() private analytics?: AnalyticsService
  ) {}
}
```

### 2. Module System

Modules organize providers and define the dependency graph:

```typescript
@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [UserService, UserRepository],
  exports: [UserService],
  entryProviders: [AnalyticsService], // Eager initialization
})
class UserModule {}
```

### 3. Application Bootstrap

```typescript
const app = await Application.create(AppModule, {
  debug: true,
  config: {
    apiUrl: 'https://api.example.com',
    featureFlags: { newUI: true },
  },
  onReady: (ctx) => console.log('Ready!'),
});

const userService = app.get(UserService);
await app.close('SIGTERM');
```

---

## Advanced Features

### 1. Module Distance Tracking

**What**: Measures how far each module is from the root module in the dependency
graph.

**Why**: Ensures lifecycle hooks run in **breadth-first order** (root → children
→ grandchildren).

**How**:

- Distance calculated during scanner's DFS traversal
- Stored on `Module.distance` property
- Used to sort modules before calling lifecycle hooks
- Shutdown hooks run in **reverse order** (leaf → root)

**Example**:

```typescript
// Root module (distance = 0)
@Module({ imports: [ChildModule], providers: [RootService] })
class RootModule {}

// Child module (distance = 1)
@Module({ imports: [GrandchildModule], providers: [ChildService] })
class ChildModule {}

// Grandchild module (distance = 2)
@Module({ providers: [GrandchildService] })
class GrandchildModule {}

// Lifecycle hook execution order:
// 1. RootService.onModuleInit()
// 2. ChildService.onModuleInit()
// 3. GrandchildService.onModuleInit()
```

---

### 2. ModuleRef.create() — Dynamic Instantiation

**What**: Instantiate classes **outside the normal DI flow** with either
DI-resolved dependencies or custom arguments.

**Why**: Needed for factories, dynamic components, and testing.

**How**:

```typescript
// 1. Get module reference from application
const moduleRef = app.getModuleRef(UserModule);

// 2. Create instance with DI-resolved dependencies
const service = moduleRef.create(UserService);

// 3. Create instance with custom arguments
const service = moduleRef.create(UserService, [customDb, customLogger]);
```

**Example: Service Factory**:

```typescript
@Injectable()
class ServiceFactory {
  private counter = 0;

  createService(config: any, moduleRef: ModuleRef): DynamicService {
    return moduleRef.create(DynamicService, [
      `service-${++this.counter}`,
      config,
    ]);
  }
}

// Usage
const factory = app.get(ServiceFactory);
const moduleRef = app.getModuleRef(FactoryModule);
const service1 = factory.createService({ timeout: 5000 }, moduleRef);
```

**Implementation**:

- Requires injector access (attached via `app.getModuleRef()`)
- Resolves constructor dependencies automatically
- Supports `@Optional()` dependencies
- Does NOT register instances in the container

---

### 3. Entry Providers — Eager Initialization

**What**: Providers instantiated **immediately on bootstrap**, even if not
injected anywhere.

**Why**: Some providers need to run side effects on startup (analytics, event
listeners, background services).

**How**:

```typescript
@Module({
  providers: [AnalyticsService, EventBusService],
  entryProviders: [AnalyticsService, EventBusService], // ← Instantiated immediately
})
class MonitoringModule {}
```

**Example**:

```typescript
@Injectable()
class AnalyticsService implements OnModuleInit {
  onModuleInit() {
    console.log('Analytics initialized');
    this.trackPageView(window.location.pathname);
    this.registerErrorHandler();
  }

  private registerErrorHandler() {
    window.addEventListener('error', (event) => {
      // Track error
    });
  }
}
```

**Implementation**:

- Resolved after all regular providers
- Resolved before `onModuleInit()` hooks
- Supports all provider types (class, factory, etc.)
- Can be combined with dynamic modules

---

### 4. Application Config — Global Settings

**What**: Global configuration object passed to `Application.create()` and
automatically registered as `'APP_CONFIG'`.

**Why**: Centralize app-wide settings instead of hardcoding or using separate
config modules.

**How**:

```typescript
// 1. Pass config to Application.create()
const app = await Application.create(AppModule, {
  config: {
    apiUrl: 'https://api.example.com',
    featureFlags: { newUI: true },
    environment: 'production',
  },
});

// 2. Inject in any service
@Injectable()
class ApiService {
  constructor(@Inject('APP_CONFIG') private config: any) {}

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  isFeatureEnabled(feature: string): boolean {
    return this.config.featureFlags?.[feature] ?? false;
  }
}
```

**Implementation**:

- Registered as a value provider in the root module
- Automatically exported (available everywhere)
- Root module becomes global when config is provided
- Type-safe with TypeScript generics

---

### 5. Lifecycle Hooks

**Complete Lifecycle Order**:

**Bootstrap**:

1. All providers instantiated
2. Entry providers resolved (eager initialization)
3. `onModuleInit()` (per module, breadth-first by distance)
4. `onApplicationBootstrap()` (per module, breadth-first by distance)
5. Application ready

**Shutdown**:

1. `beforeApplicationShutdown(signal)` (reverse order by distance)
2. `onApplicationShutdown(signal)` (reverse order by distance)
3. `onModuleDestroy()` (reverse order by distance)
4. Application closed

**All Lifecycle Hooks**:

| Hook                                 | When                                | Use Case                             |
| ------------------------------------ | ----------------------------------- | ------------------------------------ |
| `onModuleInit()`                     | After module providers instantiated | Initialize module-specific resources |
| `onApplicationBootstrap()`           | After all modules initialized       | Final app-wide setup                 |
| `beforeApplicationShutdown(signal?)` | Before shutdown starts              | Stop accepting new work              |
| `onApplicationShutdown(signal?)`     | During shutdown                     | Close connections, flush buffers     |
| `onModuleDestroy()`                  | Final cleanup phase                 | Release resources                    |

**Example**:

```typescript
@Injectable()
class DatabaseService
  implements
    OnModuleInit,
    OnApplicationBootstrap,
    BeforeApplicationShutdown,
    OnApplicationShutdown,
    OnModuleDestroy
{
  onModuleInit() {
    console.log('1. Module initialized');
  }

  onApplicationBootstrap() {
    console.log('2. Application bootstrapped');
    // Start background jobs that need full DI graph
  }

  beforeApplicationShutdown(signal?: string) {
    console.log(`3. Preparing for shutdown (${signal})`);
    // Stop accepting new connections
  }

  onApplicationShutdown(signal?: string) {
    console.log(`4. Shutting down (${signal})`);
    // Close database connections
  }

  onModuleDestroy() {
    console.log('5. Final cleanup');
  }
}

// Trigger shutdown
await app.close('SIGTERM');
```

---

### 6. Global Application vs Global Module

**Two Different Concepts**:

#### Global Module (`@Global()` decorator)

```typescript
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
class ConfigModule {}
```

- **Purpose**: Make a **module's exports** available everywhere
- **Scope**: Per-module metadata
- **Benefit**: Avoid importing ConfigModule in every module
- **Metadata Key**: `GLOBAL_MODULE_METADATA = '__module:global__'`

#### Global Application (Application Singleton)

```typescript
// Automatically set by Application.create()
const app = await Application.create(AppModule);

// ContainerProvider works without props
<ContainerProvider>
  <App />
</ContainerProvider>
```

- **Purpose**: Store the **entire application instance** globally
- **Scope**: Application-wide singleton
- **Benefit**: No prop drilling in React, cleaner integration
- **Implementation**: `global-application.ts` module

**When to Use Each**:

| Use Case                                | Solution                              |
| --------------------------------------- | ------------------------------------- |
| Make ConfigService available everywhere | `@Global()` on ConfigModule           |
| Avoid passing app to ContainerProvider  | Global application (automatic)        |
| Share providers across modules          | `@Global()` + exports                 |
| Access container in React hooks         | Global application + `useContainer()` |

---

## RegistryScanner: Compile-Time Module Scanning

### Overview

`RegistryScanner` is an alternative to `DependenciesScanner` that uses
pre-compiled decorator registries instead of runtime reflection.

### Benefits

| Feature           | DependenciesScanner (Runtime) | RegistryScanner (Compile-time) |
| ----------------- | ----------------------------- | ------------------------------ |
| Runtime overhead  | ❌ High (~50-200ms)           | ✅ Zero                        |
| Bundle size       | ❌ +50KB (reflect-metadata)   | ✅ Minimal                     |
| Bootstrap time    | ❌ Slow                       | ✅ Fast                        |
| Static validation | ❌ No                         | ✅ Yes                         |
| Tree-shaking      | ❌ No                         | ✅ Yes                         |

### Setup

1. **Install decorator discovery plugin**:

   ```bash
   pnpm add -D @stackra/vite-decorator-discovery
   ```

2. **Add plugin to vite.config.ts**:

   ```typescript
   import { decoratorDiscoveryPlugin } from '@stackra/vite-decorator-discovery';

   export default defineConfig({
     plugins: [decoratorDiscoveryPlugin(), react()],
   });
   ```

3. **Add type reference to vite-env.d.ts**:
   ```typescript
   /// <reference types="vite/client" />
   /// <reference types="@stackra/vite-decorator-discovery/virtual-modules" />
   ```

### Usage

```typescript
import { Application } from '@stackra/ts-container';

// Automatically uses RegistryScanner if available
const app = await Application.create(AppModule);
```

### How It Works

**DependenciesScanner (Runtime)**:

```
Application startup:
  → Reflect.getMetadata('imports', AppModule)  // Runtime reflection
  → Reflect.getMetadata('providers', AppModule)
  → Recurse into imports...
```

**Cost**: ~50-200ms + 50KB bundle size

**RegistryScanner (Compile-time)**:

```
Build time:
  → Vite plugin scans all decorators
  → Generates virtual:decorator-registry/modules

Application startup:
  → Import virtual:decorator-registry/modules  // Pre-compiled
  → Lookup AppModule in registry
  → Recurse into imports...
```

**Cost**: ~0ms + minimal bundle size

### Performance

For a typical application with 50 modules and 200 providers:

| Metric         | DependenciesScanner | RegistryScanner | Improvement     |
| -------------- | ------------------- | --------------- | --------------- |
| Bootstrap time | 180ms               | 5ms             | **97% faster**  |
| Bundle size    | +52KB               | +2KB            | **96% smaller** |
| Memory usage   | Higher              | Lower           | **~30% less**   |

---

## Provider Types

### 1. Class Provider (Shorthand)

```typescript
@Module({
  providers: [UserService], // Shorthand for { provide: UserService, useClass: UserService }
})
```

### 2. Class Provider (Explicit)

```typescript
@Module({
  providers: [
    { provide: UserService, useClass: UserServiceImpl },
  ],
})
```

### 3. Value Provider

```typescript
@Module({
  providers: [
    { provide: 'API_URL', useValue: 'https://api.example.com' },
  ],
})
```

### 4. Factory Provider

```typescript
@Module({
  providers: [
    {
      provide: DbConnection,
      useFactory: (config: ConfigService) => createConnection(config),
      inject: [ConfigService],
    },
  ],
})
```

### 5. Existing (Alias) Provider

```typescript
@Module({
  providers: [
    CacheManager,
    { provide: 'CACHE', useExisting: CacheManager },
  ],
})
```

---

## Scopes

### Singleton (Default)

```typescript
@Injectable() // Default scope
class UserService {}
```

- One instance per application
- Cached after first resolution
- Shared across all consumers

### Transient

```typescript
@Injectable({ scope: Scope.TRANSIENT })
class RequestLogger {}
```

- New instance on every injection
- Not cached
- Useful for stateful services

---

## React Integration

### Setup

```typescript
import { Application, ContainerProvider } from '@stackra/ts-container';
import { createRoot } from 'react-dom/client';

// Create application
const app = await Application.create(AppModule);

// Render with provider (no props needed - uses global app)
createRoot(document.getElementById('root')!).render(
  <ContainerProvider>
    <App />
  </ContainerProvider>
);
```

### Using Hooks

```typescript
import { useInject, useContainer } from '@stackra/ts-container/react';

function UserProfile() {
  // Inject services
  const userService = useInject(UserService);
  const apiUrl = useInject<string>('API_URL');

  // Access container
  const container = useContainer();
  const hasAnalytics = container.has(AnalyticsService);

  return <div>{userService.getCurrentUser().name}</div>;
}
```

---

## Dynamic Modules

### forRoot() Pattern

```typescript
@Module({})
class CacheModule {
  static forRoot(config: CacheConfig): DynamicModule {
    return {
      module: CacheModule,
      global: true,
      providers: [{ provide: CACHE_CONFIG, useValue: config }, CacheManager],
      exports: [CacheManager],
    };
  }
}

// Usage
@Module({
  imports: [CacheModule.forRoot({ ttl: 3600 })],
})
class AppModule {}
```

### forFeature() Pattern

```typescript
@Module({})
class DatabaseModule {
  static forRoot(config: DbConfig): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [{ provide: DB_CONFIG, useValue: config }, ConnectionManager],
      exports: [ConnectionManager],
    };
  }

  static forFeature(entities: Type<any>[]): DynamicModule {
    const repositories = entities.map((entity) => ({
      provide: `${entity.name}Repository`,
      useFactory: (connection: ConnectionManager) =>
        connection.getRepository(entity),
      inject: [ConnectionManager],
    }));

    return {
      module: DatabaseModule,
      providers: repositories,
      exports: repositories,
    };
  }
}

// Usage
@Module({
  imports: [
    DatabaseModule.forRoot({ host: 'localhost' }),
    DatabaseModule.forFeature([User, Post]),
  ],
})
class AppModule {}
```

---

## Circular Dependencies

### Using forwardRef()

```typescript
import { forwardRef } from '@stackra/ts-container';

@Module({
  imports: [forwardRef(() => BModule)],
  providers: [AService],
  exports: [AService],
})
class AModule {}

@Module({
  imports: [forwardRef(() => AModule)],
  providers: [BService],
  exports: [BService],
})
class BModule {}
```

---

## Best Practices

### 1. Module Organization

- **Feature modules**: Group related providers by feature
- **Shared modules**: Use `@Global()` for truly global services (config,
  logging)
- **Core module**: Single import for all global services

### 2. Provider Naming

- Use descriptive class names: `UserService`, `AuthGuard`, `CacheManager`
- Use SCREAMING_SNAKE_CASE for tokens: `API_URL`, `CACHE_CONFIG`
- Use symbols for internal tokens: `Symbol('INTERNAL_TOKEN')`

### 3. Lifecycle Hooks

- Use `onModuleInit()` for module-specific initialization
- Use `onApplicationBootstrap()` for app-wide initialization
- Use `onModuleDestroy()` for cleanup
- Always make hooks async if they perform I/O

### 4. Testing

```typescript
// Create test application
const app = await Application.create(TestModule, {
  config: { environment: 'test' },
});

// Get service
const service = app.get(UserService);

// Test
expect(service.getUsers()).toHaveLength(0);

// Cleanup
await app.close();
```

### 5. Performance

- Use `RegistryScanner` for production builds
- Use `entryProviders` sparingly (only for true side effects)
- Prefer singleton scope (default) over transient
- Use lazy loading for large feature modules

---

## Common Patterns

### 1. Configuration Module

```typescript
@Global()
@Module({})
class ConfigModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: ConfigModule,
      global: true,
      providers: [{ provide: APP_CONFIG, useValue: config }, ConfigService],
      exports: [ConfigService],
    };
  }
}
```

### 2. Feature Module with Repository

```typescript
@Module({
  imports: [DatabaseModule],
  providers: [
    UserService,
    UserRepository,
    { provide: 'USER_CACHE', useValue: new Map() },
  ],
  exports: [UserService],
})
class UserModule {}
```

### 3. Factory with Dependencies

```typescript
@Module({
  providers: [
    {
      provide: 'HTTP_CLIENT',
      useFactory: (config: ConfigService) => {
        return axios.create({
          baseURL: config.get('API_URL'),
          timeout: config.get('TIMEOUT'),
        });
      },
      inject: [ConfigService],
    },
  ],
})
class HttpModule {}
```

---

## Troubleshooting

### "Provider not found"

- Ensure provider is registered in a module
- Ensure module is imported
- Check if provider is exported from its module

### "Circular dependency detected"

- Use `forwardRef()` for circular module imports
- Refactor to remove circular dependency
- Use event-driven architecture instead

### "Virtual decorator registries not found"

- Add `@stackra/vite-decorator-discovery` plugin
- Add type reference to `vite-env.d.ts`
- Check plugin configuration in `vite.config.ts`

### Lifecycle hooks not running

- Implement the interface: `implements OnModuleInit`
- Ensure provider is resolved (not lazy)
- Check module distance (hooks run breadth-first)

---

## Key Files

| File                                     | Purpose                            |
| ---------------------------------------- | ---------------------------------- |
| `src/decorators/injectable.decorator.ts` | `@Injectable()` decorator          |
| `src/decorators/module.decorator.ts`     | `@Module()` decorator              |
| `src/decorators/inject.decorator.ts`     | `@Inject()` decorator              |
| `src/injector/container.ts`              | Core DI container                  |
| `src/injector/scanner.ts`                | Runtime module scanner             |
| `src/injector/registry-scanner.ts`       | Compile-time module scanner        |
| `src/injector/injector.ts`               | Dependency resolution engine       |
| `src/injector/instance-loader.ts`        | Provider instantiation + lifecycle |
| `src/application/application.ts`         | Application bootstrap              |
| `src/application/global-application.ts`  | Global application singleton       |
| `src/providers/container.provider.tsx`   | React provider component           |
| `src/hooks/use-inject.hook.ts`           | React injection hook               |

---

## Summary

| Feature                    | Priority   | Benefit                                  |
| -------------------------- | ---------- | ---------------------------------------- |
| Module Distance Tracking   | ⭐⭐⭐⭐⭐ | Predictable lifecycle hook order         |
| ModuleRef.create()         | ⭐⭐⭐⭐   | Dynamic instantiation, factories         |
| Entry Providers            | ⭐⭐⭐     | Eager initialization for side effects    |
| Application Config         | ⭐⭐⭐     | Centralized global settings              |
| Additional Lifecycle Hooks | ⭐⭐       | Finer-grained control                    |
| RegistryScanner            | ⭐⭐⭐⭐⭐ | 97% faster bootstrap, 96% smaller bundle |
| Global Application         | ⭐⭐⭐⭐   | Cleaner React integration                |

All features are **production-ready** and follow NestJS patterns for
familiarity.
