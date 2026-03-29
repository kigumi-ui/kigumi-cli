# Eval 1: Convert Web Awesome HTML to Kigumi Vue

## Install Missing Components

First, make sure the required components are installed:

```bash
npx kigumi add input
npx kigumi add button
```

## Converted Vue SFC

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Input } from '@/components/ui';

const form = reactive({ name: '', email: '' });
const loading = ref(false);

async function handleSubmit(e: Event) {
  e.preventDefault();
  loading.value = true;
  try {
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="wa-stack wa-gap-m" @submit="handleSubmit">
    <Input
      label="Name"
      required
      @input="(e: Event) => (form.name = (e.target as HTMLInputElement).value)"
    />
    <Input
      label="Email"
      type="email"
      required
      @input="(e: Event) => (form.email = (e.target as HTMLInputElement).value)"
    />
    <Button variant="brand" type="submit" :loading="loading">Submit</Button>
  </form>
</template>
```

## Transformations Applied

1. **`wa-input` to `<Input>`** -- PascalCase Kigumi component. Static props (`label`, `required`, `type`) pass through unchanged. No `v-model` -- Web Awesome components do not support it. Instead, `:value` + `@input` with manual target casting is used.

2. **`wa-button` to `<Button>`** -- `variant="brand"` and `type="submit"` pass through as static props. The `:loading` binding is added so you can show a spinner during form submission.

3. **Form state** -- `reactive()` holds the form fields. Each `@input` handler casts `e.target` to `HTMLInputElement` to access `.value`. This is required because Web Awesome emits native DOM `InputEvent`s, not Vue's `update:modelValue`.

4. **Layout** -- The `<form>` uses `class="wa-stack wa-gap-m"` (Web Awesome utility classes) to stack inputs vertically with medium spacing.

5. **`class` not `className`** -- Vue uses `class` on all elements, including Kigumi wrappers. No transformation needed here (unlike React where `className` would be required).
