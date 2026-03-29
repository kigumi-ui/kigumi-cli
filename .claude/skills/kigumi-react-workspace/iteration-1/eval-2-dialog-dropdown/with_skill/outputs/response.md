# Web Awesome to Kigumi React Transformation

## Install Missing Components

Dropdown and DropdownItem are not yet installed. Dialog and Button are already present.

```bash
npx kigumi add dropdown dropdown-item
```

## Imports

```tsx
import { useState } from 'react';
import { Button, Dialog, Dropdown, DropdownItem } from '@/components/ui';
```

## Component

```tsx
export default function ConfirmDeleteWithOptions() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {/* Confirm Delete Dialog */}
      <Dialog
        label="Confirm Delete"
        className="dialog-confirm"
        open={dialogOpen}
        onWaHide={() => setDialogOpen(false)}
      >
        <p>Are you sure you want to delete this item?</p>
        <div
          slot="footer"
          className="wa-cluster wa-justify-content-end wa-gap-s"
        >
          <Button variant="neutral" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger">Delete</Button>
        </div>
      </Dialog>

      {/* Options Dropdown */}
      <Dropdown>
        <Button slot="trigger" with-caret>
          Options
        </Button>
        <DropdownItem>Edit</DropdownItem>
        <DropdownItem>Duplicate</DropdownItem>
      </Dropdown>
    </>
  );
}
```

## Transformations Applied

1. **Component mapping**: `wa-dialog` to `<Dialog>`, `wa-button` to `<Button>`, `wa-dropdown` to `<Dropdown>`, `wa-dropdown-item` to `<DropdownItem>`.
2. **`class` to `className`**: All `class` attributes converted to `className` on both HTML elements (`<div>`) and Kigumi wrappers (`<Dialog>`). Web Awesome utility classes (`wa-cluster`, `wa-justify-content-end`, `wa-gap-s`) preserved as-is.
3. **Slots preserved**: `slot="footer"` and `slot="trigger"` kept unchanged.
4. **Kebab-case props**: `with-caret` stays as-is per transformation rules.
5. **Variant mapping**: `variant="neutral"` and `variant="danger"` pass through unchanged (both are valid Kigumi variants).
6. **State management added**: Dialog requires controlled `open` state with `onWaHide` handler to close. A `useState` hook manages the dialog's visibility. The Cancel button also calls `setDialogOpen(false)` for explicit dismissal.
7. **TypeScript**: Output uses `.tsx` syntax (matching the kigumi-react starter project convention).
