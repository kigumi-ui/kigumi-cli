import { useRef, useState, type FormEvent } from 'react';
import { Button, Callout, Dialog, Input, Textarea } from '@/components/ui';

interface UserProfile {
  displayName: string;
  bio: string;
}

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void>;
  initialValues?: UserProfile;
}

export function EditProfileDialog({
  open,
  onClose,
  onSave,
  initialValues = { displayName: '', bio: '' },
}: EditProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLElement & { requestClose: () => void }>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const profile: UserProfile = {
      displayName: formData.get('displayName') as string,
      bio: formData.get('bio') as string,
    };

    try {
      await onSave(profile);
      dialogRef.current?.requestClose();
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    dialogRef.current?.requestClose();
  };

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      label="Edit Profile"
      onHide={() => {
        setError('');
        onClose();
      }}
    >
      <form id="edit-profile" className="wa-stack wa-gap-m" onSubmit={handleSubmit}>
        {error && <Callout variant="danger">{error}</Callout>}
        <Input
          label="Display name"
          name="displayName"
          value={initialValues.displayName}
          required
        />
        <Textarea
          label="Bio"
          name="bio"
          value={initialValues.bio}
          rows={4}
          resize="vertical"
        />
      </form>
      <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="brand" type="submit" form="edit-profile" loading={loading}>
          Save
        </Button>
      </div>
    </Dialog>
  );
}

// Usage example
export function ProfilePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: 'Jane Doe',
    bio: 'Design systems engineer.',
  });

  const handleSave = async (updated: UserProfile) => {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    setProfile(updated);
  };

  return (
    <div className="wa-stack wa-gap-m">
      <div>
        <h2>{profile.displayName}</h2>
        <p>{profile.bio}</p>
      </div>
      <Button variant="brand" onClick={() => setDialogOpen(true)}>
        Edit Profile
      </Button>
      <EditProfileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialValues={profile}
      />
    </div>
  );
}
