# Project Structure

## Source Organization

```
src/
├── index.ts              — Main entry point
├── constants/            — DI tokens, metadata keys
├── decorators/           — Decorators
├── enums/                — Enumerations
├── facades/              — Facades
├── hooks/                — React hooks
├── interfaces/           — TypeScript interfaces
├── services/             — Injectable services
├── utils/                — Utility functions
└── ts.redis.module.ts
```

## Conventions

- Each folder has an `index.ts` barrel export
- Tests in `__tests__/`
- Examples in `.examples/`
- React hooks in `src/hooks/use-*/use-*.hook.ts`
