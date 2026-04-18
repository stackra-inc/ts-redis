---
inclusion: always
---

# Metadata Management Standards

This document defines how metadata is read, written, and managed across
`@stackra/ts-container`. All metadata operations **must** go through
`@vivtel/metadata` — never call `Reflect.*` directly.

---

## 1. The Rule: No Raw `Reflect.*` Calls

**Never do this:**

```typescript
Reflect.defineMetadata(KEY, value, target);
Reflect.getMetadata(KEY, target);
Reflect.getOwnMetadata(KEY, target);
```

**Always do this:**

```typescript
import { defineMetadata, getMetadata, hasOwnMetadata } from '@vivtel/metadata';

defineMetadata(KEY, value, target);
getMetadata(KEY, target);
hasOwnMetadata(KEY, target);
```

The only exception is `import 'reflect-metadata'` for the polyfill side-effect,
which is handled once at the entry point (`src/index.ts`). Individual files do
not need to import it.

---

## 2. Function Selection Guide

| Operation                          | Function         | When to use                                       |
| ---------------------------------- | ---------------- | ------------------------------------------------- |
| Write a single value               | `defineMetadata` | Setting a watermark, scope, or flag               |
| Read a single value                | `getMetadata`    | Reading any stored metadata                       |
| Append to an array                 | `updateMetadata` | Decorators that accumulate entries                |
| Read multiple keys at once         | `getAllMetadata` | When you need 2+ keys from the same target        |
| Check existence (with inheritance) | `hasMetadata`    | Checking if a class or its parent has metadata    |
| Check existence (direct only)      | `hasOwnMetadata` | Bundler workarounds (SWC/esbuild wrapper classes) |
| Remove metadata                    | `clearMetadata`  | Test teardown, cache invalidation                 |

---

## 3. The `updateMetadata` Pattern

Any decorator that **appends to an array** must use `updateMetadata`. This
replaces the manual read-default-spread-write pattern.

**Before (forbidden):**

```typescript
const existing = Reflect.getMetadata(KEY, target) || [];
Reflect.defineMetadata(KEY, [...existing, newItem], target);
```

**After (required):**

```typescript
import { updateMetadata } from '@vivtel/metadata';

updateMetadata(KEY, [] as ItemType[], (items) => [...items, newItem], target);
```

This applies to all decorators that accumulate metadata:

- `@Inject()` — appends to `self:paramtypes` and `self:properties_metadata`
- `@Optional()` — appends to `optional:paramtypes` and
  `optional:properties_metadata`

---

## 4. Typed Reads with `getMetadata<T>`

Always provide the generic type parameter when reading metadata. Never use the
untyped form.

```typescript
// ✅ Typed — preferred
const paramTypes =
  getMetadata<InjectionToken[]>(PARAMTYPES_METADATA, type) ?? [];
const scopeOptions = getMetadata<ScopeOptions>(SCOPE_OPTIONS_METADATA, type);
const isGlobal = getMetadata<boolean>(GLOBAL_MODULE_METADATA, type);

// ❌ Untyped — forbidden
const paramTypes = getMetadata(PARAMTYPES_METADATA, type);
```

Use `?? []` (nullish coalescing) instead of `|| []` for array defaults — it
correctly handles `null` without treating `0` or `''` as falsy.

---

## 5. Batch Reads with `getAllMetadata`

When reading two or more keys from the same target in the same operation, use
`getAllMetadata` to batch them into a single call.

```typescript
// ✅ Batch read — preferred
const {
  [PROPERTY_DEPS_METADATA]: properties,
  [OPTIONAL_PROPERTY_DEPS_METADATA]: optionalKeys,
} = getAllMetadata<{
  [PROPERTY_DEPS_METADATA]: Array<{
    key: string | symbol;
    type: InjectionToken;
  }>;
  [OPTIONAL_PROPERTY_DEPS_METADATA]: Array<string | symbol>;
}>([PROPERTY_DEPS_METADATA, OPTIONAL_PROPERTY_DEPS_METADATA], type);

// ❌ Separate reads — avoid when keys are from the same target
const properties = getMetadata(PROPERTY_DEPS_METADATA, type);
const optionalKeys = getMetadata(OPTIONAL_PROPERTY_DEPS_METADATA, type);
```

---

## 6. `hasOwnMetadata` vs `hasMetadata`

Use `hasOwnMetadata` when you need to distinguish between metadata defined
**directly on a class** vs inherited from a parent. This is specifically needed
for the SWC/esbuild bundler workaround in the injector.

```typescript
// Bundler wrapper class workaround — check own metadata first
const paramTypes =
  getMetadata<InjectionToken[]>(PARAMTYPES_METADATA, type) ??
  (hasOwnMetadata(PARAMTYPES_METADATA, type)
    ? getMetadata<InjectionToken[]>(PARAMTYPES_METADATA, type)
    : undefined) ??
  [];
```

Use `hasMetadata` (prototype chain) when checking lifecycle hook interfaces:

```typescript
// Lifecycle hook detection — inheritance is intentional
if (hasMetadata('onModuleInit', instance)) { ... }
```

---

## 7. Metadata Key Registry

All metadata keys are defined in `src/constants/tokens.constant.ts`. **Never use
raw string literals as metadata keys** — always reference the constant.

```typescript
// ✅ Always use the constant
defineMetadata(INJECTABLE_WATERMARK, true, target);

// ❌ Never use raw strings
defineMetadata('__injectable__', true, target);
```

### Key Ownership Table

| Constant                          | Written by               | Read by                                 |
| --------------------------------- | ------------------------ | --------------------------------------- |
| `INJECTABLE_WATERMARK`            | `@Injectable()`          | Scanner (validation)                    |
| `SCOPE_OPTIONS_METADATA`          | `@Injectable()`          | `Module.getClassScope()`                |
| `GLOBAL_MODULE_METADATA`          | `@Global()`              | `NestContainer.isGlobalModule()`        |
| `MODULE_METADATA.IMPORTS`         | `@Module()`              | `DependenciesScanner`                   |
| `MODULE_METADATA.PROVIDERS`       | `@Module()`              | `DependenciesScanner`                   |
| `MODULE_METADATA.EXPORTS`         | `@Module()`              | `DependenciesScanner`                   |
| `MODULE_METADATA.ENTRY_PROVIDERS` | `@Module()`              | `InstanceLoader`                        |
| `PARAMTYPES_METADATA`             | TypeScript compiler      | `Injector.getConstructorDependencies()` |
| `SELF_DECLARED_DEPS_METADATA`     | `@Inject()`              | `Injector.getConstructorDependencies()` |
| `OPTIONAL_DEPS_METADATA`          | `@Optional()`            | `Injector.getOptionalDependencies()`    |
| `PROPERTY_DEPS_METADATA`          | `@Inject()` (property)   | `Injector.resolveProperties()`          |
| `OPTIONAL_PROPERTY_DEPS_METADATA` | `@Optional()` (property) | `Injector.resolveProperties()`          |

---

## 8. Adding New Metadata Keys

When adding a new metadata key:

1. Add the constant to `src/constants/tokens.constant.ts` with a full JSDoc
   comment explaining what writes it and what reads it.
2. Export it from `src/constants/index.ts`.
3. Export it from `src/index.ts` (for library authors).
4. Use `defineMetadata` / `getMetadata` from `@vivtel/metadata` — never raw
   `Reflect.*`.
5. Update the Key Ownership Table above.

```typescript
// src/constants/tokens.constant.ts
/**
 * Metadata key for X.
 * Written by: @MyDecorator()
 * Read by: MyConsumer
 */
export const MY_NEW_KEY = 'my:new:key';
```

---

## 9. Type Casting in Decorators

TypeScript's decorator signatures use `string | symbol | undefined` for `key`
and `InjectionToken | ForwardReference | undefined` for resolved tokens. When
passing these into typed `updateMetadata` callbacks, cast at the point of use —
not at the variable declaration.

```typescript
// ✅ Cast at point of use inside the callback
updateMetadata(
  PROPERTY_DEPS_METADATA,
  [] as Array<{ key: string | symbol; type: InjectionToken }>,
  (props) => [
    ...props,
    { key: key as string | symbol, type: resolvedToken as InjectionToken },
  ],
  target.constructor as object
);

// ❌ Don't cast the variable itself — it loses the narrowing context
const safeKey = key as string | symbol; // avoid
```

---

## 10. Test Teardown

Use `clearMetadata` in test teardown to prevent metadata leaking between tests.

```typescript
import { clearMetadata } from '@vivtel/metadata';
import { INJECTABLE_WATERMARK, SCOPE_OPTIONS_METADATA } from '@/constants';

afterEach(() => {
  // Clear all metadata from test classes
  clearMetadata(undefined, TestService);
  clearMetadata(undefined, TestModule);
});
```
