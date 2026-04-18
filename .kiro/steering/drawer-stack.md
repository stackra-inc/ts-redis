---
inclusion: auto
---

# Drawer Stack System — Developer Guide

## Overview

The drawer stack system is a comprehensive, production-ready panel management
library at `packages/ui/src/components/drawer-stack/`. It provides stacked side
panels (desktop) and Vaul-style bottom sheets (mobile) with full accessibility,
drag-to-dismiss, focus trapping, and a composite component API.

## Architecture

```
DrawerStackProvider → DrawerContainer → DesktopPanel | MobilePanel
                                         ↓
                                    DrawerIdContext + DrawerPositionContext
                                         ↓
                                    Drawer.* composite components
```

- **DrawerStackProvider** — wraps your app, manages the stack via `useReducer`
- **DrawerContainer** — renders panels, handles animations, backdrop, ESC key
- **Drawer.\*** — composite sub-components for building drawer content

## Path Aliases

Inside `packages/ui/src/components/drawer-stack/`:

- `@drawer/*` → `./src/components/drawer-stack/*` (internal imports)
- `@/components/slot` → the global Slot component
- `@onboarding/*` → `./src/components/onboarding/*` (sibling system)

## Composite Components (Drawer.\*)

| Component          | Purpose                            | Key Props                                                                                                          |
| ------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Drawer.Header`    | Title bar with back/close          | `title`, `subtitle`, `icon`, `variant`, `pills`, `actions`, `isLoading`, `closeDisplay`, `hideClose`, `hideHandle` |
| `Drawer.SubHeader` | Secondary bar (tabs, info, search) | `variant: "default" \| "tabs" \| "info"`                                                                           |
| `Drawer.Content`   | Scrollable body area               | `padding: "none" \| "compact" \| "default" \| "spacious"`                                                          |
| `Drawer.Footer`    | Sticky bottom actions              | `variant`, `isLoading`, `startContent`, `endContent`                                                               |
| `Drawer.Loading`   | Loading states                     | `isLoading`, `variant: "spinner" \| "skeleton" \| "overlay"`, `label`, `lines`                                     |
| `Drawer.Alert`     | Inline banners                     | `variant: "info" \| "success" \| "warning" \| "danger"`, `title`, `dismissible`                                    |
| `Drawer.Stepper`   | Step indicators                    | `current`, `steps`, `variant: "dots" \| "numbered" \| "progress"`                                                  |
| `Drawer.Section`   | Labeled content group              | `title`, `description`                                                                                             |
| `Drawer.Divider`   | Horizontal separator               | `label`                                                                                                            |
| `Drawer.Empty`     | Empty state placeholder            | `icon`, `title`, `description`, `action`                                                                           |
| `Drawer.Toolbar`   | Horizontal action bar              | `children`, `variant`                                                                                              |

`Drawer.Body` is a deprecated alias for `Drawer.Content`.

## Stack Operations

```tsx
const { operations, stack, isOpen, activeDrawer } = useDrawerStack();

operations.push(config, component); // Add drawer (async if onBeforeOpen)
operations.pop(); // Remove top (checks onBeforeClose)
operations.replace(config, component); // Replace top
operations.update(id, component); // Swap content without re-mount
operations.clear(); // Remove all
operations.popTo(id); // Pop all above id
operations.forcePop(); // Pop without guard check
operations.bringToTop(id); // Move existing to top
```

## DrawerConfig Options

```typescript
{
  id: string;                          // Required — unique identifier
  width?: number | string;             // Default: 480px. Supports CSS values
  closeOnEscape?: boolean;             // Default: true
  singleton?: boolean;                 // Default: false — prevent duplicates
  metadata?: Record<string, unknown>;  // Arbitrary data
  snapPoints?: number[];               // Mobile snap heights as fractions (0-1)
  direction?: "ltr" | "rtl";           // Override text direction
  onBeforeOpen?: () => boolean | Promise<boolean>;
  onBeforeClose?: () => boolean | Promise<boolean>;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  observeResize?: boolean;             // Mobile ResizeObserver
}
```

## Provider Props

```tsx
<DrawerStackProvider
  persistKey="my-app-drawers"           // Optional localStorage key
  onRestore={(ids) => { /* re-push */ }} // Called on mount with saved IDs
  enableKeyboardNavigation              // Ctrl+Tab, Ctrl+1-9
>
```

## Header Variants

- `"default"` — standard with title, subtitle, border
- `"hero"` — floating buttons over hero image
- `"compact"` — dense, single-line with inline pills

## Slot System

All components render `ScopedSlot` which checks both global and drawer-ID-scoped
slots:

- Global: `drawer.header.before` — renders in ALL drawers
- Scoped: `drawer.checkout.header.before` — renders only in drawer with
  `id="checkout"`

Available positions: `DRAWER_SLOTS.HEADER`, `.SUB_HEADER`, `.CONTENT`,
`.FOOTER`, `.STEPPER`, `.ALERT`, `.SECTION`, `.DIVIDER`, `.CONTAINER`

## Mobile Bottom Sheet

- Vaul-style full-height sheet with elastic drag
- Background scales down when open (`data-drawer-wrapper` attribute required on
  app wrapper)
- Nested displacement for stacked sheets
- Snap points support for half-sheet drawers
- DragHandle visible on touch devices only

## Desktop Side Panel

- Right-edge panel with peek offsets for stacked drawers
- Left-edge grip handle for drag-to-dismiss
- RTL support: panels slide from left edge when `direction="rtl"`

## Keyboard Navigation

When `enableKeyboardNavigation` is set:

- `Ctrl+Tab` — cycle to next drawer
- `Ctrl+Shift+Tab` — cycle to previous
- `Ctrl+1..9` — jump to drawer by position
- `Escape` — close top drawer (respects `closeOnEscape` and
  `event.defaultPrevented`)

## Coding Conventions

- Use `@drawer/*` path aliases for all internal imports
- Use `ScopedSlot` (not raw `Slot`) in all drawer components
- All new components need: interface file, component file, index.ts barrel,
  update parent barrels
- Follow the folder structure: `components/<name>/<name>.component.tsx`
- Add slot positions to `DRAWER_SLOTS` constant for any new component
- Use `useDrawerId()` to access the current drawer's config.id
- Footer actions: use `startContent`/`endContent` for left/right placement
- Loading states: use `isLoading` prop on Header and Footer
