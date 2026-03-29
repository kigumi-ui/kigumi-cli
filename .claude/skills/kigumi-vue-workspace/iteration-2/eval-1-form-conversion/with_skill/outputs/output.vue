<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Input } from '@/components/ui';

const form = reactive({
  name: '',
  email: '',
});
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
      @input="(e: Event) => form.name = (e.target as HTMLInputElement).value"
    />
    <Input
      label="Email"
      type="email"
      required
      @input="(e: Event) => form.email = (e.target as HTMLInputElement).value"
    />
    <Button variant="brand" type="submit" :loading="loading">Submit</Button>
  </form>
</template>
