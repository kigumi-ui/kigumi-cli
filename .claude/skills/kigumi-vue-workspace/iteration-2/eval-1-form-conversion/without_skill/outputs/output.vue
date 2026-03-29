<script setup lang="ts">
import { ref } from 'vue';
import { Button, Input } from '@/components/ui';

const name = ref('');
const email = ref('');

const handleSubmit = () => {
  // form submission logic
};
</script>

<template>
  <form class="wa-stack wa-gap-m" @submit.prevent="handleSubmit">
    <Input v-model="name" label="Name" required />
    <Input v-model="email" label="Email" type="email" required />
    <Button variant="brand" type="submit">Submit</Button>
  </form>
</template>
