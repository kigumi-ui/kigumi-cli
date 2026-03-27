---
name: kigumi-compose-overlay
description: >
  Build overlay interactions including confirmation dialogs, form dialogs,
  side panels, dropdown menus, tooltips, popovers, and toast notifications.
  Use when the user asks to create a modal, dialog, drawer, dropdown menu,
  context menu, popover, tooltip, notification toast, or any UI that appears
  above the main content.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Compose Overlay Interactions

Build production-ready overlay UIs: Dialog, Drawer, Dropdown, Tooltip, Popover, Toast.

## When to Use

- **Modal / confirmation dialog** (delete confirmation, discard changes)
- **Form dialog** (edit profile, create entity)
- **Side panel / drawer** (detail view, filters)
- **Dropdown menu** (actions, context menu)
- **Tooltip** (icon hint, keyboard shortcut)
- **Popover** (filter panel, settings)
- **Toast notification** (success, error, warning)

## Critical Rules

1. **Overlays emit CustomEvent (`wa-show`, `wa-hide`), NOT native DOM events.**
2. **Always `requestClose()`, never `hide()`.** requestClose triggers wa-hide (cancelable). hide bypasses it.
3. **Always provide `label` prop** on Dialog and Drawer for accessibility.
4. **Focus trap is automatic.** No manual focus management needed.
5. **Controlled `open` pattern:** `open={state}` + sync close in handler.
6. **`className` vs `class`:** On Kigumi wrappers (`<Dialog>`, `<Button>`, `<Drawer>`, etc.), use `className`. On raw `<wa-*>` elements, use `class`. In Vue, always use `class`.

### requestClose() Pattern

When programmatically closing overlays, prefer `requestClose()` over `hide()`. `requestClose()` fires the cancelable `wa-hide` event, allowing the close to be intercepted (e.g., to show "unsaved changes" warnings). `hide()` bypasses this.

```tsx
// CORRECT -- triggers wa-hide event (cancelable)
dialogRef.current?.requestClose();

// AVOID -- bypasses wa-hide, no chance to intercept
dialogRef.current?.hide();
```

For the common controlled pattern, `onHide` handles close initiated by the user (ESC, backdrop click) and your `requestClose()` calls:

```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} label="Title" onHide={() => setOpen(false)}>
  <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
    <Button onClick={() => dialogRef.current?.requestClose()}>Cancel</Button>
  </div>
</Dialog>
```

## Overlay Selection

| Use Case | Component | Install |
|---|---|---|
| Focused task / decision | **Dialog** | `npx kigumi add dialog` |
| Form in modal | **Dialog** + form controls | `npx kigumi add dialog input button` |
| Detail panel / sidebar | **Drawer** | `npx kigumi add drawer` |
| Actions menu | **Dropdown** + **DropdownItem** | `npx kigumi add dropdown dropdown-item` |
| Brief hint on hover | **Tooltip** | `npx kigumi add tooltip` |
| Interactive floating content | **Popover** | `npx kigumi add popover` |
| Transient notification | **Toast** (Pro) | `npx kigumi add toast` |

## Decision Tree

```
User needs overlay
|
+-- Requires user decision? --> Confirmation Dialog (A)
+-- Requires form input? --> Form Dialog (B)
+-- Shows detail/supplementary? --> Side Panel / Drawer (C)
+-- List of actions? --> Dropdown Menu (D)
+-- Brief non-interactive hint? --> Tooltip (E)
+-- Interactive floating content? --> Popover (F)
+-- Transient status feedback? --> Toast (G, Pro)
```

## Framework Adaptation

**React:** `useState` for open, `onHide={() => setOpen(false)}`
**Vue:** `ref(false)` for open, `@wa-hide="open = false"`

## Accessibility

- [ ] Dialog/Drawer has `label` prop
- [ ] Icon-only trigger buttons have `aria-label`
- [ ] Danger actions use `variant="danger"`
- [ ] Forms inside dialogs have `label` on every input

## Related Skills

- **compose-form** -- for form-in-dialog patterns (validation, multi-step wizards inside overlays)
- **compose-layout** -- for side panel layouts (drawer as persistent navigation, app shell with drawer)
- **compose-data** -- for detail drawers (data tables that open row details in a Drawer)

## References

- [Overlay Patterns](references/overlay-patterns.md) -- 7 patterns with React + Vue
- [State Management](references/overlay-state-management.md) -- controlled pattern, event lifecycle, focus
