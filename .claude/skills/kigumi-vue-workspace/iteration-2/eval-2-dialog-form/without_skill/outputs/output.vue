<script setup lang="ts">
import { ref } from 'vue';
import { Button, Dialog, Input, Textarea } from '@/components/ui';

const isOpen = ref(false);

const name = ref('');
const email = ref('');
const notes = ref('');

function handleSave() {
  // Handle save logic here
  isOpen.value = false;
}

function handleCancel() {
  isOpen.value = false;
}
</script>

<template>
  <div>
    <Button variant="brand" size="medium" @click="isOpen = true">Open Dialog</Button>

    <Dialog v-model:open="isOpen" label="Edit Profile">
      <form class="wa-stack wa-gap-m" @submit.prevent="handleSave">
        <Input v-model="name" label="Name" type="text" required />
        <Input v-model="email" label="Email" type="email" required />
        <Textarea v-model="notes" label="Notes" :rows="4" resize="auto" />
      </form>

      <div slot="footer" class="wa-cluster wa-gap-s wa-justify-content-end">
        <Button appearance="outlined" size="medium" @click="handleCancel">Cancel</Button>
        <Button variant="brand" size="medium" @click="handleSave">Save</Button>
      </div>
    </Dialog>
  </div>
</template>
