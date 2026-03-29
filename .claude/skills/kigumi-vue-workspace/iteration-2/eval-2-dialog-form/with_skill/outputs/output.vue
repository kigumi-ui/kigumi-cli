<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Dialog, Input, Select, Option, Textarea } from '@/components/ui';

const open = ref(false);
const loading = ref(false);

const form = reactive({
  name: '',
  email: '',
  role: '',
  notes: '',
});

function resetForm() {
  form.name = '';
  form.email = '';
  form.role = '';
  form.notes = '';
}

function handleCancel() {
  open.value = false;
}

async function handleSave() {
  loading.value = true;
  try {
    await fetch('/api/users', {
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
</script>

<template>
  <Button variant="brand" @click="open = true">New User</Button>

  <Dialog
    :open="open"
    label="Add User"
    @wa-hide="open = false"
    @wa-after-hide="resetForm"
  >
    <form class="wa-stack wa-gap-m" @submit.prevent="handleSave">
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
      <Select
        label="Role"
        required
        @input="(e: Event) => (form.role = (e.target as HTMLSelectElement).value)"
      >
        <Option value="admin">Admin</Option>
        <Option value="editor">Editor</Option>
        <Option value="viewer">Viewer</Option>
      </Select>
      <Textarea
        label="Notes"
        placeholder="Optional notes"
        @input="(e: Event) => (form.notes = (e.target as HTMLInputElement).value)"
      />
    </form>

    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" @click="handleCancel">Cancel</Button>
      <Button variant="brand" :loading="loading" @click="handleSave">Save</Button>
    </div>
  </Dialog>
</template>
