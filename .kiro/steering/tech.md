# Tech Stack

## Language & Runtime

- TypeScript 6.x (strict mode, experimentalDecorators + emitDecoratorMetadata)
- Node.js >= 18
- ESM-first (`"type": "module"`)
- Target: ES2020

## Build

- **Bundler**: tsup (via `@nesvel/tsup-config`)
- **Output**: ESM (`.js`) + CJS (`.cjs`) + `.d.ts` declarations
- **Package manager**: pnpm 10.x

## Testing

- **Runner**: Vitest 4.x with `globals: true`
- **Environment**: jsdom
- **Coverage**: v8 provider

## Linting & Formatting

- **ESLint**: typescript-eslint flat config
- **Prettier**: extends `@nesvel/prettier-config`

## Path Aliases

- `@/*` → `./src/*`

## Commands

| Command          | Purpose          |
| ---------------- | ---------------- |
| `pnpm build`     | Production build |
| `pnpm test`      | Run tests once   |
| `pnpm typecheck` | Type-check       |
| `pnpm lint`      | Lint             |
| `pnpm format`    | Format           |
| `pnpm clean`     | Remove dist/     |
