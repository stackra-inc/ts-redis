---
title: Module Pattern Reference
inclusion: auto
---

# Module Pattern Reference

Every package that provides configurable services MUST follow this pattern.

## Structure

```typescript
@Module({})
export class PackageModule {
  static forRoot(config: PackageModuleOptions): DynamicModule {
    return {
      module: PackageModule,
      global: true,
      providers: [
        { provide: PACKAGE_CONFIG, useValue: config },
        { provide: PackageManager, useClass: PackageManager },
        { provide: PACKAGE_MANAGER, useExisting: PackageManager },
      ],
      exports: [PackageManager, PACKAGE_MANAGER, PACKAGE_CONFIG],
    };
  }

  static forFeature(items: Item[]): DynamicModule {
    // Register items on the global registry
    return { module: PackageModule, providers: [], exports: [] };
  }
}
```

## Rules

1. Module class MUST have `@Module({})` decorator
2. `forRoot()` MUST return `{ global: true }` so services are available
   everywhere
3. Config MUST be provided via a Symbol token (`PACKAGE_CONFIG`)
4. Manager service MUST be provided via both class and Symbol token
5. `forFeature()` is optional — only for packages that support feature-level
   registration
6. All providers in `providers` MUST also be in `exports`
7. No business logic in the module class — it's just wiring
