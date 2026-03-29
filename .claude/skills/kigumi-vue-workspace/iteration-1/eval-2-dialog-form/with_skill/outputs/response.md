# Eval 2: Dialog with a Form, Save and Cancel Buttons

## Install Required Components

```bash
npx kigumi add dialog
npx kigumi add input
npx kigumi add button
```

## Complete Vue SFC

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Dialog, Input } from '@/components/ui';

const open = ref(false);
const loading = ref(false);

const form = reactive({
  name: '',
  email: '',
});

function resetForm() {
  form.name = '';
  form.email = '';
}

async function handleSave() {
  loading.value = true;
  try {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    open.value = false;
    resetForm();
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  open.value = false;
  resetForm();
}

function handleHide() {
  open.value = false;
  resetForm();
}
</script>

<template>
  <Button variant="brand" @click="open = true">Open Form</Button>

  <Dialog :open="open" label="Edit Details" @wa-hide="handleHide">
    <form class="wa-stack wa-gap-m" @submit.prevent="handleSave">
      <Input
        label="Name"
        required
        @input="
          (e: Event) => (form.name = (e.target as HTMLInputElement).value)
        "
      />
      <Input
        label="Email"
        type="email"
        required
        @input="
          (e: Event) => (form.email = (e.target as HTMLInputElement).value)
        "
      />
    </form>

    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" @click="handleCancel">Cancel</Button>
      <Button variant="brand" :loading="loading" @click="handleSave"
        >Save</Button
      >
    </div>
  </Dialog>
</template>
```

## Key Patterns Explained

### Dialog Open/Close State

The Dialog is controlled via `:open` and `@wa-hide`. This is the correct pattern -- Web Awesome dialogs do not support `v-model`. The `@wa-hide` event fires when the user presses Escape or clicks the built-in close button, so you must handle it to keep `open` in sync.

```vue
<Dialog :open="open" label="Edit Details" @wa-hide="handleHide">
```

### Footer Slot

The footer uses `slot="footer"` (attribute syntax) rather than `<template #footer>` because the footer contains a `<div>` wrapper with layout classes. Both syntaxes work; `slot="footer"` on a wrapper element is slightly more concise here.

```vue
<div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
```

The `wa-cluster` and `wa-justify-content-end` utility classes right-align the buttons. `wa-gap-s` adds small spacing between them.

### Form Inputs Without v-model

Each Input uses `@input` with explicit target casting. This is mandatory -- Web Awesome components emit native DOM events, not Vue's `update:modelValue` protocol.

### Form Reset on Close

`resetForm()` is called in both `handleCancel` and `handleHide` so that dismissing the dialog by any means (Cancel button, Escape key, close button) clears the form state.

### Dialog Props Reference

| Prop             | Type    | Description                                                |
| ---------------- | ------- | ---------------------------------------------------------- |
| `open`           | boolean | Controls visibility (always bind dynamically with `:open`) |
| `label`          | string  | Dialog header text (required for accessibility)            |
| `without-header` | boolean | Hides the header and close button                          |
| `light-dismiss`  | boolean | Close on outside click                                     |

### Dialog Events Reference

| Event           | Vue Handler      | When It Fires                                           |
| --------------- | ---------------- | ------------------------------------------------------- |
| `wa-show`       | `@wa-show`       | Dialog opens                                            |
| `wa-after-show` | `@wa-after-show` | Open animation completes                                |
| `wa-hide`       | `@wa-hide`       | Close requested (Escape, close button, or programmatic) |
| `wa-after-hide` | `@wa-after-hide` | Close animation completes                               |
