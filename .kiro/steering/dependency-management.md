---
title: Dependency Management
inclusion: auto
---

# Dependency Management

## workspace:\* Protocol

All `@stackra/*` packages within the monorepo MUST use `workspace:*` version:

```json
{
  "dependencies": {
    "@stackra/ts-container": "^2.0.4",
    "@stackra/ts-support": "workspace:*"
  }
}
```

## peerDependencies

Framework packages that other packages depend on MUST be listed as
`peerDependencies`:

```json
{
  "peerDependencies": {
    "@stackra/ts-container": "^2.0.4",
    "@stackra/ts-support": "workspace:*",
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

Rules:

- `@stackra/ts-container` — peerDependency for all packages that use DI
- `@stackra/ts-support` — peerDependency for packages using
  BaseRegistry/MultipleInstanceManager
- `react` — peerDependency for packages with React hooks/components (mark as
  optional)

## devDependencies

Build tools and type definitions go in devDependencies:

```json
{
  "devDependencies": {
    "tsup": "^8.5.1",
    "typescript": "6.0.2",
    "vitest": "^4.1.2",
    "@types/node": "^25.5.0",
    "eslint": "^10.1.0",
    "prettier": "^3.8.1"
  }
}
```

## Never in dependencies

- Build tools (tsup, typescript, eslint, prettier, vitest)
- Type definitions (@types/\*)
- Test utilities (@testing-library/_, @vitest/_)
- Packages already in peerDependencies
