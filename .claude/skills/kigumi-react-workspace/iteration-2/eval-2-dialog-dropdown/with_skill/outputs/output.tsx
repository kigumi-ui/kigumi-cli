// Install missing components first:
// npx kigumi add dropdown dropdown-item

import { useState } from 'react';
import { Button, Dialog, Dropdown, DropdownItem } from '@/components/ui';

export default function ConfirmDeleteWithOptions() {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  return (
    <>
      <Dialog
        label="Confirm Delete"
        className="dialog-confirm"
        open={dialogOpen}
        onHide={() => setDialogOpen(false)}
      >
        <p>Are you sure you want to delete this item?</p>
        <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
          <Button variant="neutral" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger">Delete</Button>
        </div>
      </Dialog>

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
