---
title: Electron Desktop Architecture
inclusion: fileMatch
fileMatchPattern: '**/desktop/**,**/packages/desktop/**'
---

# Electron Desktop Architecture

## IPC Channel Naming

All IPC channels follow the pattern `{domain}:{action}`:

- `printer:print-escpos`, `printer:list`, `printer:configure`
- `cash-drawer:open`, `cash-drawer:status`
- `window:create`, `window:close`, `window:fullscreen`
- `auth:biometric`, `keychain:set`, `keychain:get`

## Generic Preload

The preload exposes three generic methods. NEVER add per-channel entries:

```typescript
invoke(channel, ...args); // request/response
send(channel, ...args); // fire-and-forget
on(channel, callback); // main→renderer events
```

All channels are validated against an allowlist in the preload.

## Handler Map Pattern

Main process handlers are organized as one file per domain:

```
apps/desktop/src/main/handlers/
├── index.ts              — registerAllHandlers(mainWindow)
├── printer.handler.ts
├── cash-drawer.handler.ts
├── window.handler.ts
└── ...
```

Each handler file exports a `register*Handlers()` function.

## Service Pattern

Services use `bridge.invoke('channel', ...args)` — no dedicated bridge methods:

```typescript
@Injectable()
class PrinterService {
  constructor(@Inject(DesktopManager) private desktop: DesktopManager) {}

  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.desktop.isDesktop) {
      return this.desktop.bridge.print(this.receiptToHtml(data));
    }
    const commands = this.formatter.formatReceipt(data);
    await this.desktop.bridge.invoke(
      'printer:print-escpos',
      commands,
      this.config
    );
  }
}
```

## Browser Fallbacks

Every service handles browser mode internally — no bridge changes needed:

- PrinterService → window.print()
- ClipboardService → navigator.clipboard
- PowerService → Screen Wake Lock API
- NotificationService → Web Notification API
- Others → console.warn + resolve
