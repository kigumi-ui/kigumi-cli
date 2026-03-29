# Kigumi React: Dialog + Dropdown

## Install the required components

```bash
npx kigumi add dialog button dropdown dropdown-item
```

## Import the components

```tsx
import { Dialog, Button, Dropdown, DropdownItem } from '@/components/ui';
```

## Transformed JSX

```tsx
import { useState } from 'react';
import { Dialog, Button, Dropdown, DropdownItem } from '@/components/ui';

export function ConfirmDeleteExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger to open the dialog */}
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Item
      </Button>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={open}
        label="Confirm Delete"
        className="dialog-confirm"
        onHide={() => setOpen(false)}
      >
        <p>Are you sure you want to delete this item?</p>
        <div
          slot="footer"
          className="wa-cluster wa-justify-content-end wa-gap-s"
        >
          <Button variant="neutral" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger">Delete</Button>
        </div>
      </Dialog>

      {/* Dropdown */}
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

## Key changes from raw Web Awesome HTML

1. **Install via Kigumi CLI**: Run `npx kigumi add` for each component rather than importing raw `wa-*` tags directly.

2. **Kigumi wrappers instead of raw tags**: `<wa-dialog>` becomes `<Dialog>`, `<wa-button>` becomes `<Button>`, `<wa-dropdown>` becomes `<Dropdown>`, `<wa-dropdown-item>` becomes `<DropdownItem>`.

3. **Imports from `@/components/ui`**: All Kigumi-generated components are imported from the shared barrel export.

4. **`className` instead of `class`**: Standard React attribute. Note: on the `<wa-*>` tags inside the Kigumi wrappers, the wrapper handles the conversion internally using `class` on the web component element. But in your JSX consuming the wrapper, you use `className`.

5. **Controlled open state**: The Dialog wrapper accepts an `open` prop and an `onHide` callback for React-idiomatic state management, rather than relying on imperative DOM methods.

6. **Boolean attributes as props**: `with-caret` is passed directly as a prop on `<Button>` (the Kigumi wrapper forwards it to the underlying `<wa-button>`).

7. **Slot attributes preserved**: `slot="trigger"` and `slot="footer"` are standard HTML attributes that work in JSX and pass through to the underlying web component slots.
