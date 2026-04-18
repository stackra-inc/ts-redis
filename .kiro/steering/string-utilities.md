---
inclusion: always
---

# String Utilities Standard

All string manipulation in the frontend monorepo MUST use the `Str` class from
`@stackra/ts-support`. No raw native string methods.

## The Rule

**Never do this:**

```typescript
value.toLowerCase();
value.toUpperCase();
value.includes(search);
value.startsWith(prefix);
value.endsWith(suffix);
value.trim();
value.padStart(length, char);
value.repeat(count);
value.charAt(0).toUpperCase() + value.slice(1);
```

**Always do this:**

```typescript
import { Str } from '@stackra/ts-support';

Str.lower(value);
Str.upper(value);
Str.contains(value, search);
Str.startsWith(value, prefix);
Str.endsWith(value, suffix);
Str.trim(value);
Str.padLeft(value, length, char);
Str.repeat(value, count);
Str.ucfirst(value);
```

## Method Mapping

| Native method                                     | Str equivalent                 |
| ------------------------------------------------- | ------------------------------ |
| `str.toLowerCase()`                               | `Str.lower(str)`               |
| `str.toUpperCase()`                               | `Str.upper(str)`               |
| `str.includes(search)`                            | `Str.contains(str, search)`    |
| `str.startsWith(prefix)`                          | `Str.startsWith(str, prefix)`  |
| `str.endsWith(suffix)`                            | `Str.endsWith(str, suffix)`    |
| `str.trim()`                                      | `Str.trim(str)`                |
| `str.padStart(len, char)`                         | `Str.padLeft(str, len, char)`  |
| `str.padEnd(len, char)`                           | `Str.padRight(str, len, char)` |
| `str.repeat(n)`                                   | `Str.repeat(str, n)`           |
| `str.slice(0, n)`                                 | `Str.take(str, n)`             |
| `str.charAt(0).toUpperCase() + str.slice(1)`      | `Str.ucfirst(str)`             |
| `str.split('_').map(p => ucfirst(p)).join('')`    | `Str.studly(str)`              |
| `str.replace(/([a-z])([A-Z])/g, '$1-$2').lower()` | `Str.kebab(str)`               |
| `str.replace(/([a-z])([A-Z])/g, '$1_$2').lower()` | `Str.snake(str)`               |
| `str.substring(0, limit) + '...'`                 | `Str.limit(str, limit)`        |

## Exceptions

These patterns are NOT replaceable with `Str` and should stay as native:

- `.replace(/regex/)` — regex-based replacements (no `Str` equivalent)
- `.split('/')` — splitting by delimiter (returns array, not string)
- `.indexOf()` — position finding (use `Str.position()` only if you need `false`
  instead of `-1`)
- `.substring(start, end)` — mid-string extraction with both bounds
- `String(value)` — type coercion
- Array methods: `.includes()`, `.filter()`, `.map()` on arrays (not strings)

## Import Pattern

```typescript
import { Str } from '@stackra/ts-support';
```

If the package already imports from `@stackra/ts-support` (e.g.,
`BaseRegistry`), combine the imports:

```typescript
import { BaseRegistry, Str } from '@stackra/ts-support';
```

## Dependency Requirement

Every package that uses `Str` must have `@stackra/ts-support` in its
`dependencies` or `peerDependencies` in `package.json`:

```json
{
  "dependencies": {
    "@stackra/ts-support": "workspace:*"
  }
}
```
