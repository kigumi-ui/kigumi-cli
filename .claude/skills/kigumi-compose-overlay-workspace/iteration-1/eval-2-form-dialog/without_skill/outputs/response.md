# Edit Profile Form Dialog

## Prerequisites

Install the required Kigumi components:

```bash
npx kigumi add dialog input textarea button
```

## Component Code

Create `src/components/examples/EditProfileDialog.tsx`:

```tsx
import { useState } from 'react';
import { Button, Dialog, Input, Textarea } from '@/components/ui';

interface UserProfile {
  displayName: string;
  bio: string;
}

interface EditProfileDialogProps {
  open: boolean;
  profile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void>;
  onClose: () => void;
}

export function EditProfileDialog({
  open,
  profile,
  onSave,
  onClose,
}: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ displayName, bio });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleHide = (event: CustomEvent) => {
    if (saving) {
      event.preventDefault();
      return;
    }
    onClose();
  };

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
          onInput={(e) => setBio((e.target as HTMLInputElement).value)}
        />
      </div>

      <div
        slot="footer"
        className="wa-cluster wa-justify-content-end wa-gap-xs"
      >
        <Button appearance="outlined" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="brand" onClick={handleSave} loading={saving}>
          Save
        </Button>
      </div>
    </Dialog>
  );
}
```

## Usage Example

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui';
import { EditProfileDialog } from '@/components/examples/EditProfileDialog';

export function ProfilePage() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState({
    displayName: 'Jane Doe',
    bio: 'Design systems engineer.',
  });

  const handleSave = async (updated: { displayName: string; bio: string }) => {
    // Replace with your actual API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setProfile(updated);
  };

  return (
    <div className="wa-stack wa-gap-m">
      <h2>{profile.displayName}</h2>
      <p>{profile.bio}</p>
      <Button onClick={() => setOpen(true)}>Edit Profile</Button>

      <EditProfileDialog
        open={open}
        profile={profile}
        onSave={handleSave}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
```

## How It Works

- **Dialog** is controlled via the `open` prop. The `onHide` callback fires when the user presses Escape or clicks the close button. This keeps dialog state in the parent.
- **Input** and **Textarea** use the `onInput` event to capture value changes, reading from `e.target.value`.
- **Save** calls the async `onSave` prop, shows a loading spinner on the Save button via `loading={saving}`, and disables both buttons during the request. On success, `onClose()` closes the dialog.
- **Cancel** calls `onClose()` directly, which sets `open` to `false` in the parent.
- **Preventing close during save**: The `onHide` handler calls `event.preventDefault()` while saving is in progress, so pressing Escape or clicking the overlay does not dismiss the dialog mid-save.
- Footer buttons use `slot="footer"` to place them in the Dialog's footer area. The `wa-cluster` and `wa-justify-content-end` utility classes right-align the buttons with proper spacing.
