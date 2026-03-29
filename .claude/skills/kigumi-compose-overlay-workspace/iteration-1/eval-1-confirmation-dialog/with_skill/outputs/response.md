# Confirmation Dialog: Delete Project

## Install Components

Dialog and Button are required. Both are already installed in a typical Kigumi project, but verify:

```bash
npx kigumi add dialog button
```

## React

### Imports

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';
```

### Reusable ConfirmDialog Component

```tsx
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} label={title} onHide={onClose}>
      <p>{message}</p>
      <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Delete
        </Button>
      </div>
    </Dialog>
  );
}
```

### Usage

```tsx
export function DeleteProjectButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteProject();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Project
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        loading={loading}
      />
    </>
  );
}
```

## Vue

### Reusable ConfirmDialog Component

```vue
<!-- ConfirmDialog.vue -->
<script setup lang="ts">
import { Button, Dialog } from '@/components/ui';

defineProps<{
  open: boolean;
  title: string;
  message: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>

<template>
  <Dialog :open="open" :label="title" @wa-hide="emit('close')">
    <p>{{ message }}</p>
    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" @click="emit('close')">Cancel</Button>
      <Button variant="danger" :loading="loading" @click="emit('confirm')"
        >Delete</Button
      >
    </div>
  </Dialog>
</template>
```

### Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui';
import ConfirmDialog from './ConfirmDialog.vue';

const open = ref(false);
const loading = ref(false);

async function handleDelete() {
  loading.value = true;
  try {
    await deleteProject();
    open.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Button variant="danger" @click="open = true">Delete Project</Button>
  <ConfirmDialog
    :open="open"
    title="Delete Project"
    message="Are you sure you want to delete this project?"
    :loading="loading"
    @close="open = false"
    @confirm="handleDelete"
  />
</template>
```

## Key Decisions

1. **`variant="danger"` on the Delete button** signals a destructive action visually (red) and semantically for accessibility.
2. **`variant="neutral"` on Cancel** gives it lower visual priority so the user's eye is drawn to the danger action first.
3. **Controlled `open` state** with `onHide` (React) / `@wa-hide` (Vue) keeps the dialog in sync when the user presses Escape or clicks the close button.
4. **`label` prop** on Dialog provides the accessible name (required for screen readers).
5. **`loading` prop** on the Delete button disables it and shows a spinner during the async operation, preventing double-submits.
6. **No `light-dismiss`** on the Dialog, because confirmation dialogs for destructive actions should not close on backdrop click.
7. **Footer uses `wa-cluster wa-justify-content-end wa-gap-s`** to right-align the buttons with consistent spacing.
8. **Vue uses `slot="footer"` attribute** (not `<template #footer>`) because Kigumi Vue wrappers pass content through to the web component's shadow DOM slots.
