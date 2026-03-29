import { useState } from 'react';
import { Button, Dialog, Input, Textarea } from '@/components/ui';

interface UserProfile {
  displayName: string;
  bio: string;
}

interface EditProfileDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Current profile data to pre-fill the form */
  profile: UserProfile;
  /** Called when the dialog should close (cancel, overlay dismiss, or after save) */
  onClose: () => void;
  /** Called with updated profile data on save. Return a promise to handle async saves. */
  onSave: (profile: UserProfile) => Promise<void> | void;
}

export function EditProfileDialog({ open, profile, onClose, onSave }: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);

  function handleHide(event: CustomEvent) {
    // Prevent closing while a save is in progress
    if (saving) {
      event.preventDefault();
      return;
    }
    onClose();
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ displayName, bio });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} label="Edit Profile" onHide={handleHide}>
      <div className="wa-stack wa-gap-m">
        <Input
          label="Display name"
          value={displayName}
          onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
        />
        <Textarea
          label="Bio"
          value={bio}
          rows={4}
          resize="vertical"
          onInput={(e) => setBio((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <Button
        slot="footer"
        appearance="outlined"
        onClick={onClose}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        slot="footer"
        variant="brand"
        onClick={handleSave}
        loading={saving}
      >
        Save
      </Button>
    </Dialog>
  );
}
