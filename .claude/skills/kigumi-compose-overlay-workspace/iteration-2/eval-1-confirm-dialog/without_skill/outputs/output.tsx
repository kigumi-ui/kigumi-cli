import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';

export function ConfirmDeleteDialog() {
  const [open, setOpen] = useState(false);

  function handleDelete() {
    setOpen(false);
    // TODO: wire up actual delete logic
    console.log('Project deleted');
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Project
      </Button>

      <Dialog
        open={open}
        label="Delete project"
        onHide={() => setOpen(false)}
      >
        <p>Are you sure you want to delete this project?</p>

        <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-xs">
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
