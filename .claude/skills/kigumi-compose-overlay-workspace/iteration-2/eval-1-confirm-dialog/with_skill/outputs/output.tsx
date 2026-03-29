import { useRef, useState } from 'react';
import { Button, Dialog } from '@/components/ui';

// ---------------------------------------------------------------------------
// ConfirmDeleteDialog -- reusable confirmation dialog for destructive actions
// ---------------------------------------------------------------------------

interface ConfirmDeleteDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close (Cancel, ESC, close button) */
  onClose: () => void;
  /** Called when the user confirms the delete action */
  onConfirm: () => void;
  /** Shows a loading spinner on the Delete button while the action is in progress */
  loading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
}: ConfirmDeleteDialogProps) {
  const dialogRef = useRef<HTMLElement & { requestClose: () => void }>(null);

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      label="Delete project"
      onHide={onClose}
    >
      <p>Are you sure you want to delete this project?</p>

      <div
        slot="footer"
        className="wa-cluster wa-justify-content-end wa-gap-s"
      >
        <Button
          variant="neutral"
          onClick={() => dialogRef.current?.requestClose()}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Delete
        </Button>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Usage example -- wires open/close state and simulates an async delete
// ---------------------------------------------------------------------------

export default function DeleteProjectExample() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Replace with your actual delete logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Project
      </Button>

      <ConfirmDeleteDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}
