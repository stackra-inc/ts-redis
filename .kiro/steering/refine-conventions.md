---
title: Refine Project Conventions
inclusion: auto
---

# Refine Project File Structure and Naming Conventions

## 🚨 Critical Rules - MUST FOLLOW

### 1. File and Folder Naming

**ALL file and folder names MUST use lowercase kebab-case**

- ✅ `use-tenant.hook.ts`, `create-button.component.tsx`,
  `tenant-config.interface.ts`
- ❌ `useTenant.hook.ts`, `CreateButton.component.tsx`, `use_tenant.hook.ts`,
  `TenantConfig.interface.ts`

### 2. Export Interfaces

**Export interfaces MUST live in `interfaces/` folder**

- One `.interface.ts` file per export interface
- File name: lowercase kebab-case with `.interface.ts` suffix
- Example: `interfaces/tenant-config.interface.ts`
- Example: `interfaces/multi-tenancy-provider.interface.ts`

### 3. Export Types

**Export types MUST live in `types/` folder**

- One `.type.ts` file per export type
- File name: lowercase kebab-case with `.type.ts` suffix
- Example: `types/tenant-mode.type.ts`
- Example: `types/tenant-response.type.ts`

### 4. Export Enums

**Export enums MUST live in `enums/` folder**

- One `.enum.ts` file per export enum
- File name: lowercase kebab-case with `.enum.ts` suffix
- Example: `enums/tenant-status.enum.ts`
- Example: `enums/tenant-mode.enum.ts`

### 5. Test Files

**Test files use `.test.ts` or `.test.tsx` extension**

- NOT `.spec.ts` or `.spec.tsx`
- Example: `use-tenant.hook.test.ts`
- Example: `create-button.component.test.tsx`

### 6. Index Files

**Every folder with multiple files MUST have an `index.ts` (or `index.tsx`)**

- Re-exports the public API
- Example: `hooks/use-tenant/index.ts`
- Example: `components/create-button/index.tsx`

### 7. Documentation Files

**DO NOT create .md or documentation files unless explicitly requested**

- No summary files, no documentation files, no README files
- Only create when user explicitly asks for documentation

---

## File Naming Conventions

### General Rules

- **ALL file and folder names MUST use lowercase kebab-case**
- Files have appropriate suffixes based on their content type
- Each file should have a single responsibility
- One export per file for interfaces, types, and enums

### File Suffixes

#### Hooks

- Pattern: `use-{name}/use-{name}.hook.ts`
- Example: `use-tenant/use-tenant.hook.ts`
- Index file: `use-tenant/index.ts` (re-exports the hook)
- Test file: `use-tenant/use-tenant.hook.test.ts`

#### Interfaces

- Pattern: `interfaces/{name}.interface.ts`
- Example: `interfaces/multi-tenancy-provider.interface.ts`
- **CRITICAL:** One interface per file
- **CRITICAL:** Export interface only
- Must live in `interfaces/` folder

#### Types

- Pattern: `types/{name}.type.ts`
- Example: `types/tenant.type.ts`
- **CRITICAL:** One type per file
- **CRITICAL:** Export type only
- Must live in `types/` folder

#### Enums

- Pattern: `enums/{name}.enum.ts`
- Example: `enums/tenant-mode.enum.ts`
- **CRITICAL:** One enum per file
- **CRITICAL:** Export enum only
- Must live in `enums/` folder

#### Components

- Pattern: `{component-name}/{component-name}.component.tsx`
- Example: `with-tenant/with-tenant.component.tsx`
- Example: `auto-save-indicator/auto-save-indicator.component.tsx`
- Index file: `with-tenant/index.tsx` (re-exports the component)
- Test file: `with-tenant/with-tenant.component.test.tsx`
- Types file: `with-tenant/with-tenant.types.ts` (component-specific types)
- **Note:** Folder/file names are kebab-case, but exported component is
  PascalCase
  - Folder: `auto-save-indicator/`
  - File: `auto-save-indicator.component.tsx`
  - Export: `export const AutoSaveIndicator = () => { ... }`

#### Contexts

- Pattern: `{context-name}/{context-name}.context.tsx`
- Example: `multi-tenancy/multi-tenancy.context.tsx`
- Index file: `multi-tenancy/index.tsx` (re-exports context and provider)
- Test file: `multi-tenancy/multi-tenancy.context.test.tsx`

#### Utilities

- Pattern: `utils/{util-name}.util.ts`
- Example: `utils/parse-subdomain.util.ts`
- Test file: `utils/parse-subdomain.util.test.ts`

#### Helpers

- Pattern: `helpers/{helper-name}.helper.ts`
- Example: `helpers/format-tenant-name.helper.ts`
- Test file: `helpers/format-tenant-name.helper.test.ts`

#### Services

- Pattern: `services/{service-name}.service.ts`
- Example: `services/tenant-api.service.ts`
- Test file: `services/tenant-api.service.test.ts`

#### Providers

- Pattern: `providers/{provider-name}.provider.tsx`
- Example: `providers/notification-provider.provider.tsx`
- Test file: `providers/notification-provider.provider.test.tsx`
- Component exports use PascalCase: `NotificationProvider`
- Function/const exports use camelCase: `notificationProvider`,
  `useNotificationProvider`

#### Constants

- Pattern: `constants/{name}.constant.ts`
- Example: `constants/default-tenant-config.constant.ts`

#### Resolvers (for multi-tenancy)

- Pattern: `resolvers/{resolver-name}.resolver.ts`
- Example: `resolvers/subdomain.resolver.ts`
- Each resolver is responsible for resolving tenant from a specific source
- Test file: `resolvers/subdomain.resolver.test.ts`

#### Configurations

- Pattern: `configs/{name}.config.ts`
- Example: `configs/tenant.config.ts`
- JSON configs: `configs/{name}.config.json`

## Directory Structure

### Standard Package Structure

```
packages/{package-name}/
├── src/
│   ├── components/
│   │   └── {component-name}/
│   │       ├── {component-name}.component.tsx
│   │       ├── {component-name}.types.ts
│   │       ├── {component-name}.component.test.tsx
│   │       └── index.tsx
│   ├── contexts/
│   │   └── {context-name}/
│   │       ├── {context-name}.context.tsx
│   │       ├── {context-name}.types.ts
│   │       ├── {context-name}.context.test.tsx
│   │       └── index.tsx
│   ├── hooks/
│   │   └── use-{hook-name}/
│   │       ├── use-{hook-name}.hook.ts
│   │       ├── use-{hook-name}.types.ts
│   │       ├── use-{hook-name}.hook.test.ts
│   │       └── index.ts
│   ├── interfaces/
│   │   ├── {interface-name}.interface.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── {type-name}.type.ts
│   │   └── index.ts
│   ├── enums/
│   │   ├── {enum-name}.enum.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── {constant-name}.constant.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── {util-name}.util.ts
│   │   ├── {util-name}.util.test.ts
│   │   └── index.ts
│   ├── helpers/
│   │   ├── {helper-name}.helper.ts
│   │   ├── {helper-name}.helper.test.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── {service-name}.service.ts
│   │   ├── {service-name}.service.test.ts
│   │   └── index.ts
│   ├── providers/
│   │   └── {provider-name}/
│   │       ├── {provider-name}.provider.tsx
│   │       ├── {provider-name}.types.ts
│   │       ├── {provider-name}.provider.test.tsx
│   │       └── index.tsx
│   ├── resolvers/
│   │   ├── {resolver-name}.resolver.ts
│   │   ├── {resolver-name}.resolver.test.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Export Patterns

### Index Files

Each directory should have an `index.ts` that re-exports its contents:

```typescript
// hooks/use-tenant/index.ts
export { useTenant } from './use-tenant';
export type { UseTenantReturn } from './use-tenant';
```

### Barrel Exports

Top-level directories should have barrel exports:

```typescript
// interfaces/index.ts
export type { MultiTenancyProvider } from './multi-tenancy-provider.interface';
export type { TenantResolver } from './tenant-resolver.interface';
export type { TenantConfig } from './tenant-config.interface';
```

## Naming Conventions

### Variables and Functions

- Use camelCase: `getTenantId`, `currentTenant`

### Interfaces

- Use PascalCase: `MultiTenancyProvider`, `TenantResolver`
- Prefix with `I` only for context interfaces: `IMultiTenancyContext`

### Types

- Use PascalCase: `Tenant`, `TenantResponse`

### Enums

- Use PascalCase for enum name: `TenantMode`
- Use UPPER_SNAKE_CASE for enum values: `FILTER`, `HEADER`

### Constants

- Use UPPER_SNAKE_CASE: `DEFAULT_TENANT_FIELD`, `MAX_TENANTS`

### Components

- Use PascalCase: `WithTenant`, `TenantSelect`
- Layout components: Use simple names without "Themed" prefix
  - ✅ `Header`, `Sider`, `Layout`, `Title`
  - ❌ `ThemedHeader`, `ThemedSider`, `ThemedLayout`

### Providers

- Component providers use PascalCase: `ThemeProvider`, `NotificationProvider`
- Function/const providers use camelCase: `themeProvider`,
  `notificationProvider`
- When passing to Refine, use camelCase:
  ```tsx
  <Refine
    notificationProvider={notificationProvider}
    accessControlProvider={accessControlProvider}
  />
  ```

## Examples

### Hook Structure

```
hooks/
└── use-tenant/
    ├── use-tenant.hook.ts
    ├── use-tenant.types.ts
    ├── use-tenant.hook.test.ts
    └── index.ts
```

### Component Structure

```
components/
├── create-button/
│   ├── create-button.component.tsx      # exports CreateButton
│   ├── create-button.types.ts
│   ├── create-button.component.test.tsx
│   └── index.tsx
└── auto-save-indicator/
    ├── auto-save-indicator.component.tsx  # exports AutoSaveIndicator
    ├── auto-save-indicator.types.ts
    ├── auto-save-indicator.component.test.tsx
    └── index.tsx
```

### Interface Structure

```
interfaces/
├── multi-tenancy-provider.interface.ts
├── tenant-resolver.interface.ts
├── tenant-config.interface.ts
└── index.ts
```

### Type Structure

```
types/
├── tenant.type.ts
├── tenant-response.type.ts
├── tenant-mode.type.ts
└── index.ts
```

### Enum Structure

```
enums/
├── tenant-mode.enum.ts
├── tenant-status.enum.ts
└── index.ts
```

### Resolver Structure

```
resolvers/
├── subdomain.resolver.ts
├── router.resolver.ts
├── header.resolver.ts
├── subdomain.resolver.test.ts
├── router.resolver.test.ts
├── header.resolver.test.ts
└── index.ts
```

### Provider Structure

```
providers/
└── notification-provider/
    ├── notification-provider.provider.tsx
    ├── notification-provider.types.ts
    ├── notification-provider.provider.test.tsx
    └── index.tsx
```

**Example exports:**

```typescript
// notification-provider.provider.tsx
export const NotificationProvider: React.FC = () => {
  /* ... */
};
export const notificationProvider = {
  /* ... */
};
export const useNotificationProvider = () => {
  /* ... */
};

// index.tsx
export {
  NotificationProvider,
  notificationProvider,
  useNotificationProvider,
} from './notification-provider.provider';
```

## Multi-Tenancy Specific Patterns

### Resolver Pattern

Inspired by nestjs-i18n, each resolver is responsible for resolving tenant from
a specific source:

```typescript
// resolvers/subdomain.resolver.ts
export class SubdomainResolver implements TenantResolver {
  resolve(): string | undefined {
    // Resolve tenant from subdomain
  }
}
```

### Configuration Pattern

Use JSON configs for tenant configuration:

```json
// configs/tenant.config.json
{
  "mode": "subdomain",
  "resolvers": ["subdomain", "header"],
  "fallback": "default-tenant",
  "subdomainMap": {
    "acme": "org-123",
    "globex": "org-456"
  }
}
```

## Testing Conventions

### Test Files

- Pattern: `{name}.test.ts` or `{name}.test.tsx` (NOT `.spec.ts`)
- Located alongside the file being tested
- Example: `use-tenant.hook.ts` → `use-tenant.hook.test.ts`
- Example: `create-button.component.tsx` → `create-button.component.test.tsx`

### Test Structure

```typescript
describe('useTenant', () => {
  describe('when tenant is loaded', () => {
    it('should return current tenant', () => {
      // test
    });
  });

  describe('when tenant is not loaded', () => {
    it('should return undefined', () => {
      // test
    });
  });
});
```

## Documentation Conventions

### JSDoc Comments

- All exported functions, interfaces, types should have JSDoc comments
- Include `@example` for complex APIs
- Include `@param` and `@returns` for functions

````typescript
/**
 * Hook to access current tenant information
 *
 * @example
 * ```tsx
 * const { tenant, tenants, setTenant } = useTenant();
 * console.log(tenant?.name);
 * ```
 *
 * @returns Tenant information and management functions
 */
export const useTenant = () => {
  // implementation
};
````
