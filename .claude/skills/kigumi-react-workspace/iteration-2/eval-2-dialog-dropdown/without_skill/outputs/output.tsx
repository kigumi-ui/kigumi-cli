import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';
import { Dropdown } from '@/components/ui/Dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/DropdownItem/DropdownItem';

export function ConfirmDeleteWithDropdown() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {/* Confirm Delete Dialog */}
      <Dialog
        open={dialogOpen}
        label="Confirm Delete"
        className="dialog-confirm"
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

      {/* Dropdown Menu */}
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
