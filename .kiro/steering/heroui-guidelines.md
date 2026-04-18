---
title: HeroUI v3 Development Guidelines
description: Guidelines and best practices for using HeroUI v3 in this monorepo
inclusion: always
---

# HeroUI v3 Development Guidelines

This project uses HeroUI v3 (React) as the primary UI component library. All UI
components should be built using or extending HeroUI components.

## Architecture

### Single Source of Truth: @repo/ui

All HeroUI components and utilities are re-exported through the `@repo/ui`
package. **Never import directly from `@heroui/react` or `@heroui/theme` in
apps.**

```tsx
// ✅ CORRECT - Import from @repo/ui
import { Button, Card, UIProvider } from '@repo/ui';
import '@repo/ui/styles';

// ❌ WRONG - Don't import directly from HeroUI
import { Button } from '@heroui/react';
```

### Package Structure

```
packages/ui/
├── src/
│   ├── components/     # Custom wrapped components
│   ├── hooks/          # Custom React hooks
│   ├── providers/      # Context providers
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript types
│   ├── enums/          # Enums and constants
│   ├── styles.css      # Global styles
│   └── index.ts        # Main export file
```

## Component Development

### Creating New Components

1. Create component in `packages/ui/src/components/ComponentName/`
2. Add comprehensive JSDoc documentation
3. Export from `packages/ui/src/components/index.ts`
4. Export from `packages/ui/src/index.ts`

Example structure:

```
components/
└── Button/
    ├── Button.tsx      # Component implementation
    ├── index.ts        # Component exports
    └── Button.test.tsx # Tests (optional)
```

### Component Template

````tsx
/**
 * ComponentName Component
 *
 * Brief description of what the component does.
 *
 * @module components/ComponentName
 */

import { ComponentName as HeroComponentName } from '@heroui/react';
import type { ComponentNameProps as HeroComponentNameProps } from '@heroui/react';

/**
 * Props for ComponentName
 */
export interface ComponentNameProps extends HeroComponentNameProps {
  /**
   * Prop description
   * @default defaultValue
   */
  propName?: string;
}

/**
 * ComponentName Component
 *
 * Detailed description with usage examples.
 *
 * @example
 * ```tsx
 * <ComponentName propName="value">
 *   Content
 * </ComponentName>
 * ```
 */
export function ComponentName({ propName, ...rest }: ComponentNameProps) {
  return (
    <HeroComponentName {...rest}>{/* implementation */}</HeroComponentName>
  );
}
````

## Styling Guidelines

### Using Tailwind CSS v4

This project uses Tailwind CSS v4 with HeroUI's theme system.

```tsx
// Use Tailwind utilities for custom styling
<Button className="bg-gradient-to-r from-blue-500 to-purple-500">
  Gradient Button
</Button>

// Use HeroUI's built-in variants when possible
<Button color="primary" variant="shadow">
  Primary Button
</Button>
```

### Theme Customization

Customize the theme in `packages/ui/tailwind.config.ts`:

```ts
import { heroui } from '@heroui/theme';

export default {
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: '#0070F3',
              foreground: '#FFFFFF',
            },
          },
        },
      },
    }),
  ],
};
```

## Best Practices

### 1. Always Use UIProvider

Wrap your app with `UIProvider` in the root layout:

```tsx
// app/layout.tsx
import { UIProvider } from '@repo/ui';
import '@repo/ui/styles';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  );
}
```

### 2. Use Semantic Props

HeroUI uses semantic prop names for better accessibility:

```tsx
// ✅ Use isDisabled, not disabled
<Button isDisabled>Disabled</Button>

// ✅ Use onPress, not onClick (for better touch support)
<Button onPress={() => console.log('pressed')}>Click</Button>

// ✅ Use isLoading for loading states
<Button isLoading>Loading...</Button>
```

### 3. Leverage Composition

HeroUI v3 uses compound components for flexibility:

```tsx
<Card>
  <Card.Header>
    <h3>Title</h3>
  </Card.Header>
  <Card.Body>
    <p>Content</p>
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

### 4. Use Custom Hooks

Leverage the custom hooks from `@repo/ui`:

```tsx
import { useDisclosure, useIsMobile } from '@repo/ui';

function MyComponent() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useIsMobile();

  return (
    <>
      <Button onPress={onOpen}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        {/* Modal content */}
      </Modal>
    </>
  );
}
```

### 5. Use Utility Functions

Use the provided utility functions for common operations:

```tsx
import { cn, formatDate, debounce } from '@repo/ui';

// Combine class names conditionally
<div className={cn('base-class', isActive && 'active-class')} />

// Format dates consistently
<span>{formatDate(new Date(), 'en-US', { dateStyle: 'long' })}</span>

// Debounce expensive operations
const handleSearch = debounce((query) => fetchResults(query), 300);
```

## Accessibility

HeroUI v3 is built on React Aria Components with built-in accessibility:

- Keyboard navigation is handled automatically
- ARIA attributes are applied correctly
- Focus management works out of the box
- Screen reader support is included

Always test with:

- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Screen readers (VoiceOver, NVDA, JAWS)
- Color contrast tools

## Performance

### Code Splitting

Components are tree-shakeable. Only import what you need:

```tsx
// ✅ Tree-shakeable - only Button is bundled
import { Button } from '@repo/ui';

// ❌ Avoid if you only need specific components
import * as UI from '@repo/ui';
```

### Lazy Loading

Use React's lazy loading for heavy components:

```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## MCP Server Integration

This project has the HeroUI MCP server configured in `.kiro/settings/mcp.json`.
You can ask the AI assistant:

- "Show me all HeroUI components"
- "What props does the Button component have?"
- "Give me an example of using the Modal component"
- "Get the source code for the Card component"
- "Show me the theme variables"

## Resources

- [HeroUI v3 Documentation](https://heroui.com/docs/react)
- [HeroUI GitHub](https://github.com/heroui-inc/heroui)
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/)
- [Tailwind CSS v4](https://tailwindcss.com)

## Migration Notes

This project uses HeroUI v3 (Beta), which has breaking changes from v2:

- Compound component patterns (e.g., `Card.Header` instead of `CardHeader`)
- Different prop names and APIs
- Built on Tailwind CSS v4 (not v3)
- React 19+ required

Do not mix v2 and v3 components or documentation.
