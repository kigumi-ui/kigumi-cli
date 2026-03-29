# Edit Profile Form Dialog

## Install

```bash
npx kigumi add dialog input textarea button
```

All four components (Dialog, Input, Textarea, Button) are already installed in both the React and Vue starter projects.

---

## React

```tsx
import { useState, useRef, type FormEvent } from 'react';
import { Button, Dialog, Input, Textarea } from '@/components/ui';
import type { DialogRef } from '@/components/ui/Dialog/Dialog';

interface ProfileData {
  displayName: string;
  bio: string;
}

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: ProfileData;
  onSave: (data: ProfileData) => Promise<void>;
}

export function EditProfileDialog({
  open,
  onClose,
  profile,
  onSave,
}: EditProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<DialogRef>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await onSave({
        displayName: formData.get('displayName') as string,
        bio: formData.get('bio') as string,
      });
      dialogRef.current?.requestClose();
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      label="Edit Profile"
      onHide={() => onClose()}
    >
      <form
        id="edit-profile"
        className="wa-stack wa-gap-m"
        onSubmit={handleSubmit}
      >
        {error && (
          <p
            role="alert"
            style={{ color: 'var(--wa-color-danger-50)', margin: 0 }}
          >
            {error}
          </p>
        )}
        <Input
          label="Display name"
          name="displayName"
          value={profile.displayName}
          required
        />
        <Textarea
          label="Bio"
          name="bio"
          value={profile.bio}
          rows={4}
          resize="vertical"
          maxlength={160}
          hint="Brief description for your profile (max 160 characters)"
        />
      </form>
      <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button
          variant="neutral"
          onClick={() => dialogRef.current?.requestClose()}
        >
          Cancel
        </Button>
        <Button
          variant="brand"
          type="submit"
          form="edit-profile"
          loading={loading}
        >
          Save
        </Button>
      </div>
    </Dialog>
  );
}

// --- Usage ---

function ProfilePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    displayName: 'Jane Doe',
    bio: 'Design systems engineer',
  });

  const handleSave = async (data: ProfileData) => {
    // Replace with your API call
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setProfile(data);
  };

  return (
    <>
      <div className="wa-stack wa-gap-m">
        <h2>{profile.displayName}</h2>
        <p>{profile.bio}</p>
        <Button variant="neutral" onClick={() => setDialogOpen(true)}>
          Edit Profile
        </Button>
      </div>

      <EditProfileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        profile={profile}
        onSave={handleSave}
      />
    </>
  );
}
```

---

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Dialog, Input, Textarea } from '@/components/ui';

interface ProfileData {
  displayName: string;
  bio: string;
}

const props = defineProps<{
  profile: ProfileData;
}>();

const emit = defineEmits<{
  save: [data: ProfileData];
}>();

const dialogOpen = defineModel<boolean>('open', { default: false });
const loading = ref(false);
const error = ref('');

const displayName = ref(props.profile.displayName);
const bio = ref(props.profile.bio);

async function handleSubmit(e: Event) {
  e.preventDefault();
  loading.value = true;
  error.value = '';

  try {
    emit('save', {
      displayName: displayName.value,
      bio: bio.value,
    });
    dialogOpen.value = false;
  } catch {
    error.value = 'Failed to save profile. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="dialogOpen" label="Edit Profile">
    <form
      id="edit-profile"
      class="wa-stack wa-gap-m"
      @submit.prevent="handleSubmit"
    >
      <p
        v-if="error"
        role="alert"
        :style="{ color: 'var(--wa-color-danger-50)', margin: '0' }"
      >
        {{ error }}
      </p>
      <Input
        v-model="displayName"
        label="Display name"
        name="displayName"
        required
      />
      <Textarea
        v-model="bio"
        label="Bio"
        name="bio"
        :rows="4"
        resize="vertical"
        :maxlength="160"
        hint="Brief description for your profile (max 160 characters)"
      />
    </form>
    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" @click="dialogOpen = false">Cancel</Button>
      <Button
        variant="brand"
        type="submit"
        form="edit-profile"
        :loading="loading"
      >
        Save
      </Button>
    </div>
  </Dialog>
</template>
```

### Vue Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui';
import EditProfileDialog from '@/components/examples/EditProfileDialog.vue';

const dialogOpen = ref(false);
const profile = ref({
  displayName: 'Jane Doe',
  bio: 'Design systems engineer',
});

async function handleSave(data: { displayName: string; bio: string }) {
  await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  profile.value = data;
}
</script>

<template>
  <div class="wa-stack wa-gap-m">
    <h2>{{ profile.displayName }}</h2>
    <p>{{ profile.bio }}</p>
    <Button variant="neutral" @click="dialogOpen = true">Edit Profile</Button>
  </div>

  <EditProfileDialog
    v-model:open="dialogOpen"
    :profile="profile"
    @save="handleSave"
  />
</template>
```

---

## How It Works

### Dialog open/close lifecycle

The dialog uses the **controlled `open` pattern**. In React, `open={state}` + `onHide` keeps state in sync. In Vue, `v-model:open` handles both directions automatically.

Closing always goes through `requestClose()` (or the equivalent `v-model:open = false` in Vue), which fires the `wa-hide` event. This keeps the event lifecycle intact and allows interception if needed (for example, to warn about unsaved changes).

### Form submission

The `<form>` element lives inside the dialog body and uses `id="edit-profile"`. The Save button in the footer references the form via `form="edit-profile"` and `type="submit"`, which lets it trigger native form submission from outside the `<form>` tag. This is necessary because the footer lives in a separate slot.

### Close after save

On successful save, the dialog closes automatically:

- **React:** calls `dialogRef.current?.requestClose()`, which triggers `wa-hide`, and the `onHide` callback sets `open` to `false`.
- **Vue:** sets `dialogOpen.value = false` directly through the `v-model`.

On failure, the dialog stays open and displays an inline error message.

### Accessibility checklist

- Dialog has `label="Edit Profile"` for screen readers
- Input has `label="Display name"` and `required` for validation
- Textarea has `label="Bio"` and `hint` for guidance
- Error message uses `role="alert"` for live region announcement
- Focus trap is handled automatically by the Dialog component
- Cancel is reachable via keyboard (Tab to button, Enter/Space to activate)
- ESC key closes the dialog through the built-in `wa-hide` event
