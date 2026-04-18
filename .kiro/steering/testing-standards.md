---
title: Testing Standards
inclusion: auto
---

# Testing Standards

## File Location

- Tests live in `__tests__/` directory at the package root
- Test files use `.test.ts` or `.test.tsx` extension (NOT `.spec.ts`)
- Setup file: `__tests__/vitest.setup.ts`
- Type declarations: `__tests__/setup.d.ts`

## Vitest Configuration

Every package MUST have a `vitest.config.ts` with:

- `globals: true` — no need to import describe/it/expect
- `environment: 'jsdom'` — for React and DOM-dependent code
- `passWithNoTests: true` — CI won't fail during initial development
- `setupFiles` pointing to the setup file
- Path alias `@` → `./src`

## Test Structure

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do X when Y', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## DI Mocking

The setup file MUST mock `@stackra/ts-container` decorators:

```typescript
vi.mock('@stackra/ts-container', async () => {
  const actual = await vi.importActual('@stackra/ts-container');
  return {
    ...actual,
    Injectable: () => (target: any) => target,
    Inject: () => () => {},
    Module: () => (target: any) => target,
  };
});
```

## Coverage

Target: 80%+ line coverage. Use `pnpm test:coverage` to check.
