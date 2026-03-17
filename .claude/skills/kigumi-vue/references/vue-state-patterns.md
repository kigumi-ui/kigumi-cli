# Vue State Patterns

## Overlay State (Dialog, Drawer)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Dialog } from '@/components/ui';

const open = ref(false);
</script>

<template>
  <Button @click="open = true">Open Dialog</Button>
  <Dialog :open="open" label="My Dialog" @wa-hide="open = false">
    <p>Content</p>
    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" @click="open = false">Cancel</Button>
      <Button variant="brand">Confirm</Button>
    </div>
  </Dialog>
</template>
```

## Form State

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Input, Select, Option, Checkbox } from '@/components/ui';

const form = reactive({
  name: '',
  email: '',
  role: '',
  agree: false,
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
    <Select
      label="Role"
      @input="(e: Event) => form.role = (e.target as HTMLSelectElement).value"
    >
      <Option value="dev">Developer</Option>
      <Option value="design">Designer</Option>
    </Select>
    <Checkbox
      @change="(e: Event) => form.agree = (e.target as HTMLInputElement).checked"
    >
      I agree to the terms
    </Checkbox>
    <Button variant="brand" type="submit" :loading="loading">Submit</Button>
  </form>
</template>
```

## Ref Access to Web Component

Access the underlying web component for imperative methods:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Dialog } from '@/components/ui';

const dialogEl = ref<HTMLElement & { requestClose: () => void }>();

function closeDialog() {
  // CORRECT: triggers wa-hide event lifecycle
  dialogEl.value?.requestClose();
}
</script>

<template>
  <Dialog ref="dialogEl" :open="open" label="Title">
    Content
  </Dialog>
</template>
```

## Dropdown Select Handler

```vue
<script setup lang="ts">
import { Dropdown, DropdownItem, Button } from '@/components/ui';

function handleSelect(e: CustomEvent) {
  const item = e.detail.item as HTMLElement;
  const value = item.getAttribute('value');
  console.log('Selected:', value);
}
</script>

<template>
  <Dropdown @wa-select="handleSelect">
    <Button slot="trigger" with-caret>Actions</Button>
    <DropdownItem value="edit">Edit</DropdownItem>
    <DropdownItem value="delete" variant="danger">Delete</DropdownItem>
  </Dropdown>
</template>
```

## Tab Change Handler

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Tab, TabGroup, TabPanel } from '@/components/ui';

const activeTab = ref('general');

function handleTabShow(e: CustomEvent) {
  activeTab.value = (e.detail.name as string);
}
</script>

<template>
  <TabGroup @wa-tab-show="handleTabShow">
    <Tab slot="nav" panel="general">General</Tab>
    <Tab slot="nav" panel="advanced">Advanced</Tab>
    <TabPanel name="general">General content</TabPanel>
    <TabPanel name="advanced">Advanced content</TabPanel>
  </TabGroup>
</template>
```

## defineExpose for Wrapper Components

When wrapping Kigumi components in custom composables:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Dialog } from '@/components/ui';

const open = ref(false);

function show() { open.value = true; }
function hide() { open.value = false; }

defineExpose({ show, hide });
</script>

<template>
  <Dialog :open="open" label="Wrapped Dialog" @wa-hide="hide">
    <slot />
  </Dialog>
</template>
```

## Event Pattern Summary

| Need | Vue Syntax |
|------|-----------|
| Text input value | `@input="(e: Event) => val = (e.target as HTMLInputElement).value"` |
| Checkbox checked | `@change="(e: Event) => val = (e.target as HTMLInputElement).checked"` |
| Select value | `@input="(e: Event) => val = (e.target as HTMLSelectElement).value"` |
| Dialog open/close | `:open="open" @wa-hide="open = false"` |
| Dropdown selection | `@wa-select="(e: CustomEvent) => handle(e.detail.item)"` |
| Tab change | `@wa-tab-show="(e: CustomEvent) => tab = e.detail.name"` |
