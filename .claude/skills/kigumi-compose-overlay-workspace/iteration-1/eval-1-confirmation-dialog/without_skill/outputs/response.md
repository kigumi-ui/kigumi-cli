# Confirmation Dialog

## Prerequisites

Install the required Kigumi components:

```bash
npx kigumi add Dialog Button
```

## Component Code

```tsx
// src/components/examples/ConfirmDeleteDialog.tsx
import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';

export function ConfirmDeleteDialog() {
  const [open, setOpen] = useState(false);

  function handleDelete() {
    // Replace with your actual delete logic
    console.log('Project deleted');
    setOpen(false);
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Project
      </Button>

      <Dialog open={open} label="Delete project" onHide={() => setOpen(false)}>
        <p>Are you sure you want to delete this project?</p>

        <div
          slot="footer"
          className="wa-cluster wa-justify-content-end wa-gap-xs"
        >
          <Button appearance="outlined" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}
```

## How it works

- **State management**: `useState` controls the dialog's `open` prop. Setting it to `true` opens the dialog; `false` closes it.
- **Opening**: Clicking the "Delete Project" trigger button sets `open` to `true`.
- **Closing**: Three paths close the dialog:
  1. Clicking "Cancel" sets `open` to `false`.
  2. Clicking the built-in close button (X) in the header fires the `onHide` event, which sets `open` to `false`.
  3. Pressing Escape also fires `onHide`.
- **Delete action**: The red "Delete" button calls `handleDelete`, which runs your delete logic then closes the dialog.
- **Danger styling**: `variant="danger"` on the Delete button renders it in the red/danger color from the Web Awesome theme tokens.
- **Footer layout**: The `slot="footer"` div places the buttons in the dialog's footer section. The `wa-cluster` and `wa-justify-content-end` utility classes right-align the buttons with consistent spacing.
