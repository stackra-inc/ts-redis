# Docblocks & Comments Standards

Rules and conventions for writing JSDoc docblocks and inline comments across the
codebase. Every piece of code a consumer or contributor reads should be
self-documenting.

---

## When to Write Docblocks

Every exported symbol **must** have a JSDoc docblock:

- Classes
- Interfaces and type aliases
- Functions and methods (public, protected, private)
- Class properties and constructor parameters
- Enum members
- Constants (especially DI tokens)
- Barrel export files (module-level `/** ... */`)

The only exception is trivial one-line re-exports inside barrel `index.ts` files
— but even those should have a module-level docblock at the top of the file.

---

## File-Level Docblock

Every file starts with a file-level docblock describing what the file contains,
its role in the architecture, and a `@module` tag.

```typescript
/**
 * Cache Service (Repository)
 *
 * The high-level API that consumers interact with. Wraps a low-level Store
 * and provides convenience methods: get, put, remember, tags, etc.
 *
 * This class is NOT injectable — it's created internally by CacheManager.store().
 *
 * @module services/cache
 */
```

For files with complex architecture, include an ASCII diagram:

````typescript
/**
 * ## Architecture
 *
 * ```
 * CacheManager
 *   ├── extends MultipleInstanceManager<Store>
 *   ├── creates Store instances (MemoryStore, RedisStore, NullStore)
 *   └── wraps them in CacheService
 * ```
 */
````

---

## Class Docblocks

Include a summary, behavioral notes, and at least one `@example`.

````typescript
/**
 * CacheService — the consumer-facing cache API.
 *
 * Created by `CacheManager.store(name)`. Wraps a low-level Store
 * with a rich API including remember(), tags(), pull(), etc.
 *
 * @example
 * ```typescript
 * const cache = manager.store('redis');
 * await cache.put('key', 'value', 3600);
 * const user = await cache.remember('user:1', 3600, () => fetchUser(1));
 * ```
 */
export class CacheService { ... }
````

---

## Method Docblocks

Every method gets:

| Tag                  | Required                     | Notes                                             |
| -------------------- | ---------------------------- | ------------------------------------------------- |
| Summary line         | Always                       | One sentence describing what the method does      |
| Extended description | When behavior is non-obvious | Edge cases, side effects, store-specific behavior |
| `@typeParam T`       | When method is generic       | Describe what T represents                        |
| `@param`             | For every parameter          | Include type context and default values           |
| `@returns`           | Always                       | Describe the return value and edge cases          |
| `@throws`            | When method can throw        | Describe the error condition                      |
| `@example`           | For public methods           | At least one usage example                        |

````typescript
/**
 * Get a value from cache, or execute a callback and store the result.
 *
 * This is the "cache-aside" pattern:
 * 1. Check if the key exists in cache
 * 2. If found, return the cached value
 * 3. If not found, execute the callback, store the result, and return it
 *
 * @typeParam T - Type of the cached/computed value
 * @param key - The cache key
 * @param ttl - Time-to-live in seconds for the cached result
 * @param cb - Callback to execute on cache miss (can be sync or async)
 * @returns The cached or freshly computed value
 *
 * @example
 * ```typescript
 * const user = await cache.remember('user:1', 3600, async () => {
 *   return await db.users.findById(1);
 * });
 * ```
 */
async remember<T = any>(key: string, ttl: number, cb: () => Promise<T> | T): Promise<T> {
````

---

## Property & Constructor Parameter Docblocks

Class properties get a docblock describing their purpose, default value, and
visibility intent.

```typescript
/**
 * Lazily resolved Redis connection instance.
 * Cached after first resolution to avoid repeated lookups.
 */
private _connection?: RedisConnection;
```

Constructor parameters documented inline:

```typescript
/**
 * @param _store - The underlying low-level cache store implementation
 * @param _defaultTtl - Default TTL in seconds, used when no TTL is
 *   explicitly provided (default: 300s / 5 min)
 */
constructor(
  private readonly _store: Store,
  private _defaultTtl: number = 300
) {}
```

---

## Interface & Type Docblocks

Interface fields get individual docblocks with `@default` and `@example` where
applicable.

```typescript
export interface MemoryStoreConfig {
  driver: 'memory';

  /**
   * Maximum number of items to store.
   *
   * When the limit is reached, the oldest items are evicted (LRU-style).
   *
   * @default undefined (unlimited)
   * @example 1000
   */
  maxSize?: number;
}
```

Type aliases get a full docblock explaining the union/intersection and when each
variant applies.

```typescript
/**
 * Discriminated union of all built-in store configurations.
 * The `driver` field acts as the discriminant.
 */
export type StoreConfig =
  | MemoryStoreConfig
  | RedisStoreConfig
  | NullStoreConfig;
```

---

## Barrel Export Files

Every barrel `index.ts` gets:

1. A module-level docblock listing what's exported and why
2. Inline comments grouping related exports (for the main `src/index.ts`)

```typescript
/**
 * Services Barrel Export
 *
 * - {@link CacheManager} — Orchestrates multiple named cache stores
 * - {@link CacheService} — Consumer-facing API wrapping a single store
 *
 * @module services
 */

export { CacheManager } from './cache-manager.service';
export { CacheService } from './cache.service';
```

For the root `src/index.ts`, use section headers:

```typescript
// ============================================================================
// Core Services
// ============================================================================
export { CacheManager } from './services/cache-manager.service';
export { CacheService } from './services/cache.service';
```

---

## Inline Comments

Use inline comments for:

- **Non-obvious logic** — explain _why_, not _what_
- **Section separators** — group related methods within a class
- **Edge cases** — document surprising behavior
- **Workarounds** — explain why unconventional code exists

```typescript
// Redis returns null for missing keys — normalize to undefined
return value === null ? undefined : this.deserialize(value);

// Store.increment can return `false` on failure — normalize to 0
return typeof result === 'number' ? result : 0;

// 10 years in seconds — effectively forever, but still has an expiration
const result = await c.set(key, value, { ex: 315360000 });
```

Use section separators in classes with many methods:

```typescript
// ── Read ────────────────────────────────────────────────────────────────

// ── Write ───────────────────────────────────────────────────────────────

// ── Tags ────────────────────────────────────────────────────────────────
```

---

## DI Tokens & Constants

Symbol-based tokens get full docblocks with injection examples:

````typescript
/**
 * Cache configuration token.
 *
 * Used to inject the cache configuration object into services.
 *
 * @example
 * ```typescript
 * @Injectable()
 * class CacheManager {
 *   constructor(@Inject(CACHE_CONFIG) private config: CacheModuleOptions) {}
 * }
 * ```
 */
export const CACHE_CONFIG = Symbol.for('CACHE_CONFIG');
````

---

## Config Files

Config files get:

1. A file-level docblock with an environment variable table
2. Inline comments on each store explaining its purpose and trade-offs

```typescript
/**
 * ## Environment Variables
 *
 * | Variable              | Description              | Default    |
 * |-----------------------|--------------------------|------------|
 * | `VITE_CACHE_DRIVER`   | Default cache store name | `'memory'` |
 */
```

---

## Things to Avoid

- **Single-line docblocks on methods** —
  `/** Change the default store at runtime. */` is not acceptable. Every method
  must use a full multi-line docblock with a summary, description (when
  non-obvious), `@param`, `@returns`, and `@example` (for public methods). No
  exceptions.
- **Restating the obvious** — `/** Gets the name */` on `getName()` adds
  nothing. Describe behavior, edge cases, or return semantics instead.
- **Stale comments** — update docblocks when you change method signatures or
  behavior.
- **`@author` tags on methods** — git blame handles attribution.
- **Empty docblocks** — `/** */` is worse than no docblock.
- **Commenting out code** — delete it; git has history.
- **`// TODO` without context** — always include _what_ and _why_.
