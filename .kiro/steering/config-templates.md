---
title: Package Config Templates
inclusion: auto
---

# Package Config Templates

Unified config file templates for all packages. Based on the `@stackra/ts-cache`
gold standard.

## tsconfig.json

Every package MUST have this exact tsconfig (only change the package name in
comments):

```jsonc
{
  "extends": "@nesvel/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "ignoreDeprecations": "6.0",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "jsx": "react-jsx",
    "types": ["node", "vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
    },
  },
  "include": ["src/**/*", "__tests__/**/*"],
  "exclude": ["node_modules", "dist", "config"],
}
```

## Required package.json scripts

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist node_modules/.cache",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "prepublishOnly": "pnpm run build",
    "release": "pnpm publish --access public --no-git-checks"
  }
}
```

## Required package.json fields

```json
{
  "sideEffects": false,
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

## Required devDependencies

```json
{
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "eslint": "10.2.0",
    "@nesvel/eslint-config": "^1.0.5",
    "@nesvel/prettier-config": "^1.0.3",
    "@nesvel/tsup-config": "^1.0.3",
    "@nesvel/typescript-config": "^1.0.4",
    "@vitest/ui": "^4.1.2",
    "jsdom": "^29.0.1",
    "prettier": "^3.8.1",
    "tsup": "^8.5.1",
    "typescript": "^6.0.2",
    "typescript-eslint": "^8.58.0",
    "vitest": "^4.1.2"
  }
}
```

Add `@types/react` and `react` to devDependencies if the package has React
hooks/components.

## tsup.config.ts external list

Every package MUST externalize its peer dependencies. Common externals:

```typescript
external: [
  '@stackra/ts-container',
  '@stackra/ts-container-react',
  '@stackra/ts-support',
  'react',
  // Add package-specific peer deps here
],
```
