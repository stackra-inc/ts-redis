---
inclusion: always
---

# Code Standards & Conventions

Mandatory coding standards for the `@stackra` frontend monorepo. All code — new
and modified — must follow these rules. No exceptions.

## Quick Reference — Specialized Standards

| Topic               | Steering File                                                  |
| ------------------- | -------------------------------------------------------------- |
| String manipulation | `string-utilities.md` — always use `Str` class                 |
| Metadata / Reflect  | `metadata-standards.md` — always use `@vivtel/metadata`        |
| Facades             | `facade-pattern.md` — typed constant pattern                   |
| DI container        | `ts-container-architecture.md` — modules, providers, lifecycle |
| Module pattern      | `module-pattern.md` — forRoot/forFeature                       |
| Docblocks           | `docblocks-and-comments.md` — JSDoc rules                      |
| Package structure   | `package-structure-guide.md` — folder layout                   |
| Testing             | `testing-standards.md` — vitest conventions                    |
| Dependencies        | `dependency-management.md` — workspace protocol                |

---

## 1. Package Scope

The canonical package scope is `@stackra`. All packages use this scope:

```
@stackra/ts-container
@stackra/ts-support
@stackra/ts-cache
@stackra/ts-config
@stackra/ts-events
@stackra/ts-http
@stackra/ts-logger
@stackra/ts-redis
@stackra/ts-settings
@stackra/ts-desktop
@stackra/ts-pwa
@stackra/kbd
@stackra/react-auth
@stackra/react-router
@stackra/react-refine
@stackra/react-theming
@stackra/react-multitenancy
@stackra/react-i18n
```

---

## 2. File Naming

All file names use **lower-kebab-case** with a mandatory suffix:

| Content Type     | Suffix                   | Example                       |
| ---------------- | ------------------------ | ----------------------------- |
| Interface        | `.interface.ts`          | `class-provider.interface.ts` |
| Enum             | `.enum.ts`               | `scope.enum.ts`               |
| Type alias       | `.type.ts`               | `driver-creator.type.ts`      |
| Service class    | `.service.ts`            | `cache-manager.service.ts`    |
| Decorator        | `.decorator.ts`          | `injectable.decorator.ts`     |
| Utility function | `.util.ts`               | `forward-ref.util.ts`         |
| React hook       | `.hook.ts`               | `use-inject.hook.ts`          |
| React component  | `.component.tsx`         | `shortcut-list.component.tsx` |
| React provider   | `.provider.tsx`          | `container.provider.tsx`      |
| React context    | `.context.ts`            | `container.context.ts`        |
| Constant         | `.constant.ts`           | `tokens.constant.ts`          |
| Facade           | `.facade.ts`             | `cache.facade.ts`             |
| Registry         | `.registry.ts`           | `shortcut.registry.ts`        |
| Module           | `.module.ts`             | `cache.module.ts`             |
| Config           | `.config.ts`             | `logger.config.ts`            |
| Test             | `.test.ts` / `.test.tsx` | `injector.test.ts`            |
| Barrel export    | `index.ts`               | `src/interfaces/index.ts`     |

---

## 3. One Export Per File

- Every exported `interface` → own file in `src/interfaces/`
- Every exported `enum` → own file in `src/enums/`
- Every exported `type` alias → own file in `src/types/` or `src/interfaces/`
- Type guards (`is*`, `has*`) live in the same file as their interface
- Constants → `src/constants/tokens.constant.ts`

---

## 4. Imports

### Order

1. Side-effect imports (`import 'reflect-metadata'`)
2. External packages (`import axios from 'axios'`)
3. Workspace packages (`import { Str } from '@stackra/ts-support'`)
4. Path alias imports (`import { CACHE_CONFIG } from '@/constants'`)
5. Relative imports (`import { InstanceWrapper } from './instance-wrapper'`)

### Rules

- Use `import type { ... }` for type-only imports
- Use `@/` path alias for `src/` imports
- Never use `import type` for values used as injection tokens

```typescript
import 'reflect-metadata';
import axios from 'axios';
import { Str } from '@stackra/ts-support';
import { Injectable, Inject } from '@stackra/ts-container';
import type { InjectionToken, Type } from '@/interfaces';
import { CACHE_CONFIG } from '@/constants';
import { InstanceWrapper } from './instance-wrapper';
```

---

## 5. String Manipulation

**Always use `Str` from `@stackra/ts-support`.** Never use raw native string
methods. See `string-utilities.md` for the complete mapping.

```typescript
// ✅ Correct
Str.lower(value);
Str.contains(haystack, needle);
Str.ucfirst(name);

// ❌ Forbidden
value.toLowerCase();
haystack.includes(needle);
name.charAt(0).toUpperCase() + name.slice(1);
```

---

## 6. Metadata

**Always use `@vivtel/metadata`.** Never call `Reflect.*` directly. See
`metadata-standards.md` for the complete API.

```typescript
// ✅ Correct
import { defineMetadata, getMetadata } from '@vivtel/metadata';
defineMetadata(KEY, value, target);

// ❌ Forbidden
Reflect.defineMetadata(KEY, value, target);
```

---

## 7. Facades

Every package's main service gets a facade. Facades are typed constants, not
classes. See `facade-pattern.md` for the complete pattern.

```typescript
// ✅ Correct — one-line typed constant
export const CacheFacade: CacheManager = Facade.make<CacheManager>(CACHE_MANAGER);

// ❌ Forbidden — class-based facade
export class CacheFacade extends Facade { ... }
```

---

## 8. DI & Module Pattern

- Every configurable package has a `forRoot()` static method
- `forRoot()` returns `{ global: true }` so exports are available everywhere
- Config is provided via a Symbol token (`PACKAGE_CONFIG`)
- Manager service is provided via both class and Symbol token
- See `module-pattern.md` and `ts-container-architecture.md`

---

## 9. TypeScript Conventions

### Access Modifiers

Always explicit: `public`, `private`, or `protected`. Never implicit.

### Return Types

Always annotate return types on public methods.

### Readonly

Use `readonly` for properties that don't change after construction.

### Generics

Document with `@typeParam` in JSDoc. Use descriptive names: `T`, `K`, `V`.

### Nullish Coalescing

Use `?? []` instead of `|| []` for array defaults.

---

## 10. Docblocks

Every exported symbol must have a JSDoc docblock. See
`docblocks-and-comments.md` for the complete rules. Key requirements:

- File-level `@module` docblock on every file
- `@param`, `@returns`, `@throws` on every public method
- `@example` on non-trivial public methods
- Interface properties documented individually
- Enum members documented individually
- Section separators for grouping related code

---

## 11. Barrel Exports

Every folder with multiple files must have an `index.ts` barrel:

```typescript
// Use `export type` for interfaces and types
export type { ClassProvider } from './class-provider.interface';

// Use `export` for classes, functions, enums, constants
export { Scope } from './scope.enum';
```

Root `src/index.ts` uses section headers:

```typescript
// ============================================================================
// Core Services
// ============================================================================
export { CacheManager } from './services/cache-manager.service';

// ============================================================================
// Facades
// ============================================================================
export { CacheFacade } from './facades';
```

---

## 12. Folder Structure

```
src/
  application/          # Bootstrap (Application, global singleton)
  constants/            # Metadata keys, DI tokens (*.constant.ts)
  contexts/             # React contexts (*.context.ts)
  decorators/           # Decorators (*.decorator.ts)
  enums/                # Enums (*.enum.ts)
  facades/              # Facades (*.facade.ts)
  hooks/                # React hooks (use-*/use-*.hook.ts)
  interfaces/           # Interfaces & type aliases (*.interface.ts)
  providers/            # React providers (*.provider.tsx)
  registries/           # Registries (*.registry.ts)
  services/             # Services (*.service.ts)
  stores/               # Store implementations (*.store.ts)
  types/                # Type aliases (*.type.ts)
  utils/                # Utility functions (*.util.ts)
  {package}.module.ts   # Module definition
  index.ts              # Public API barrel
```

---

## 13. Naming Conventions

| Thing            | Convention                          | Example                       |
| ---------------- | ----------------------------------- | ----------------------------- |
| Files            | lower-kebab-case + suffix           | `cache-manager.service.ts`    |
| Classes          | PascalCase                          | `CacheManager`                |
| Interfaces       | PascalCase, no `I` prefix           | `DesktopBridge`               |
| Types            | PascalCase                          | `PowerState`                  |
| Constants        | UPPER_SNAKE_CASE                    | `CACHE_MANAGER`               |
| DI Tokens        | UPPER_SNAKE_CASE Symbols            | `Symbol.for('CACHE_MANAGER')` |
| Functions        | camelCase                           | `getAppVersion`               |
| Variables        | camelCase                           | `isDesktop`                   |
| Enums            | PascalCase name, UPPER_SNAKE values | `Scope.DEFAULT`               |
| React hooks      | `use` prefix                        | `useInject`                   |
| React components | PascalCase                          | `ShortcutList`                |

---

## 14. Forbidden Patterns

- ❌ Raw `Reflect.*` calls — use `@vivtel/metadata`
- ❌ Raw native string methods — use `Str` from `@stackra/ts-support`
- ❌ Class-based facades — use typed constant pattern
- ❌ `import 'reflect-metadata'` in individual files — only in entry point
- ❌ Implicit access modifiers — always explicit `public`/`private`/`protected`
- ❌ `|| []` for array defaults — use `?? []`
- ❌ `I` prefix on interfaces — use `DesktopBridge` not `IDesktopBridge`
- ❌ Singletons via `new` — use the DI container
- ❌ `TODO` without context — use issue tracker
- ❌ Commented-out code — delete it, git has history
- ❌ Empty docblocks — `/** */` is worse than none
- ❌ Single-line method docblocks — always multi-line with tags

---

## 15. Checklist Before Committing

- [ ] All string manipulation uses `Str` class
- [ ] All metadata operations use `@vivtel/metadata`
- [ ] Every new interface in its own `*.interface.ts` file
- [ ] Every new enum in its own `*.enum.ts` file
- [ ] All barrel `index.ts` files updated
- [ ] Every exported symbol has a JSDoc docblock
- [ ] Every public method has `@param`, `@returns`, `@throws`
- [ ] File starts with a file-level `@module` docblock
- [ ] Imports use `import type` for type-only imports
- [ ] All public method return types explicitly annotated
- [ ] Facade exported from package if new service added
- [ ] `@stackra/ts-support` in dependencies if using `Str`
