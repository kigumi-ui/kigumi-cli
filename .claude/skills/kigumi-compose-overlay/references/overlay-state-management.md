# Overlay State Management

## Controlled Pattern

### React

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open</Button>
<Dialog open={open} label="Title" onHide={() => setOpen(false)}>
  Content
</Dialog>
```

### Vue

```vue
const open = ref(false);

<Button @click="open = true">Open</Button>
<Dialog :open="open" label="Title" @wa-hide="open = false">
  Content
</Dialog>
```

## requestClose() vs hide()

| Method           | Triggers wa-hide? | Cancelable?                    | Use                        |
| ---------------- | ----------------- | ------------------------------ | -------------------------- |
| `requestClose()` | Yes               | Yes (`event.preventDefault()`) | Always use this            |
| `hide()`         | No                | No                             | Never use on Dialog/Drawer |

```tsx
// CORRECT: triggers event lifecycle, state stays in sync
const dialogRef = useRef<DialogRef>(null);
dialogRef.current?.requestClose();

// WRONG: bypasses event lifecycle, controlled state breaks
dialogRef.current?.element?.hide?.();
```

## Event Lifecycle

```
Opening:  wa-show -> [animation] -> wa-after-show
Closing:  wa-hide -> [animation] -> wa-after-hide
```

- `wa-show`: Emitted when open is requested. **Cancelable on Popover** (calling `preventDefault()` stops it from opening). On Dialog and Drawer, `wa-show` fires after the dialog is already opening and is not cancelable.
- `wa-hide`: Emitted when close is requested. **Cancelable** via `event.preventDefault()`.
- `wa-after-show` / `wa-after-hide`: Emitted after animation completes. Not cancelable.

### Preventing Close

```tsx
// React: prevent close if form has unsaved changes
<Dialog
  open={open}
  label="Edit"
  onHide={(e: CustomEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault(); // Dialog stays open
      // Show "discard changes?" confirmation instead
    } else {
      setOpen(false);
    }
  }}
>
```

## light-dismiss

When enabled, clicking outside the overlay closes it.

```tsx
<Dialog open={open} label="Info" light-dismiss onHide={() => setOpen(false)}>
```

**When to use:** Read-only content, non-destructive overlays.
**When NOT to use:** Forms with unsaved data, confirmation dialogs.

Both Dialog and Drawer default to `light-dismiss={false}` (Drawer since Web Awesome 3.8.0), so outside clicks never close an overlay unless you opt in.

## Focus Management

Dialog and Drawer handle focus automatically:

- **On open:** Focus moves to the first focusable element inside
- **While open:** Tab cycles through focusable elements (focus trap)
- **On close:** Focus returns to the element that triggered the overlay

No manual focus management needed. Do not call `.focus()` yourself.

## Nested Overlays

| Combination            | Supported?            |
| ---------------------- | --------------------- |
| Dialog inside Dialog   | Avoid (bad UX)        |
| Dropdown inside Dialog | Yes                   |
| Tooltip inside Dialog  | Yes                   |
| Popover inside Dialog  | Yes                   |
| Dialog inside Drawer   | Yes (but consider UX) |
