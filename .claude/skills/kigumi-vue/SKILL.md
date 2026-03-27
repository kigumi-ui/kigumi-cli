---
name: kigumi-vue
description: >
  Convert Web Awesome HTML snippets to Kigumi Vue components.
  Use when the user has a Vue project and pastes WA HTML, copies code from
  webawesome.com/docs, asks to "convert to Vue", "transform to Kigumi Vue",
  or mentions wa-* tags needing Vue equivalents. Check kigumi.config.json
  for framework: "vue" to confirm this is a Vue project.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Transform Web Awesome to Kigumi Vue

Converts Web Awesome HTML to production-ready Kigumi Vue SFC components.

## Quick Start

```html
<!-- Web Awesome input -->
<wa-card>
  <div slot="header">My Card</div>
  <wa-button variant="brand">Click me</wa-button>
</wa-card>
```

```vue
<!-- Kigumi Vue output -->
<script setup lang="ts">
import { Button, Card } from '@/components/ui';
</script>

<template>
  <Card>
    <template #header>My Card</template>
    <Button variant="brand">Click me</Button>
  </Card>
</template>
```

## Important: No v-model Support

Web Awesome components do **NOT** support Vue's `v-model`. They emit native DOM events (`input`, `change`), not Vue's `update:modelValue`.

**Wrong:**

```vue
<!-- BROKEN: v-model does not work on Kigumi components -->
<Input v-model="name" />
```

**Correct:**

```vue
<Input
  :value="name"
  @input="(e: Event) => name = (e.target as HTMLInputElement).value"
/>
```

For overlays, use `:open` + `@wa-hide`:

```vue
<Dialog :open="isOpen" @wa-hide="isOpen = false">...</Dialog>
```

## How It Works

1. **Read config** -- `kigumi.config.json` must have `framework: "vue"`
2. **Detect installed** -- list `componentsDir` subdirectories
3. **Parse WA HTML** -- extract `<wa-*>` tags, attributes, slots
4. **Generate install commands** -- for missing components
5. **Output Vue SFC** -- `<script setup>` + `<template>`

## Key Differences from React

| Aspect               | React                    | Vue                                 |
| -------------------- | ------------------------ | ----------------------------------- |
| CSS classes on HTML  | `className="..."`        | `class="..."`                       |
| CSS classes on wa-\* | `className="..."`        | `class="..."`                       |
| Dynamic props        | `prop={value}`           | `:prop="value"`                     |
| Event handlers       | `onEvent={handler}`      | `@event="handler"`                  |
| Custom events        | `onWaShow={fn}`          | `@wa-show="fn"`                     |
| Named slots          | `<div slot="name">`      | `<template #name>` or `slot="name"` |
| Conditional          | `{cond && <X/>}`         | `v-if="cond"`                       |
| Lists                | `{items.map(i => <X/>)}` | `v-for="i in items"`                |

**Vue note:** In Vue, `class` works on all elements. In React, `className` works on all elements (including Kigumi wrappers). There is no className/class split in either framework.

## Attribute Rules

| WA HTML                   | Vue                                                          |
| ------------------------- | ------------------------------------------------------------ |
| `class="..."`             | `class="..."` (same!)                                        |
| `style="max-width: 60ch"` | `style="max-width: 60ch"` or `:style="{ maxWidth: '60ch' }"` |
| `disabled`                | `disabled` or `:disabled="true"`                             |
| `slot="header"`           | `slot="header"` or `<template #header>`                      |
| `aria-*` / `data-*`       | preserved as-is                                              |

## Event Mapping

**Form controls -- native events (NOT CustomEvent):**

| Event  | Vue                 | Value Access                                         |
| ------ | ------------------- | ---------------------------------------------------- |
| input  | `@input="handler"`  | `(e.target as HTMLInputElement).value`               |
| change | `@change="handler"` | `(e.target as HTMLInputElement).value` or `.checked` |
| blur   | `@blur="handler"`   | -                                                    |
| focus  | `@focus="handler"`  | -                                                    |

**Overlays -- CustomEvent:**

| WA Event      | Vue                        |
| ------------- | -------------------------- |
| wa-show       | `@wa-show="handler"`       |
| wa-hide       | `@wa-hide="handler"`       |
| wa-after-show | `@wa-after-show="handler"` |
| wa-after-hide | `@wa-after-hide="handler"` |
| wa-select     | `@wa-select="handler"`     |

## Slot Syntax

```vue
<!-- Default slot -->
<Card>Content here</Card>

<!-- Named slot via attribute (works on any element) -->
<div slot="header">Header</div>

<!-- Named slot via template (Vue-idiomatic, preferred) -->
<template #header>
  <span>Header Content</span>
</template>
```

## Complex Components

### Dialog (controlled state)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Dialog } from '@/components/ui';

const open = ref(false);
</script>

<template>
  <Button variant="brand" @click="open = true">Open</Button>
  <Dialog :open="open" label="My Dialog" @wa-hide="open = false">
    <p>Dialog content</p>
    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" @click="open = false">Close</Button>
    </div>
  </Dialog>
</template>
```

### Form

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Input } from '@/components/ui';

const form = reactive({ name: '', email: '' });
const loading = ref(false);

async function handleSubmit(e: Event) {
  e.preventDefault();
  loading.value = true;
  await fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify(form),
  });
  loading.value = false;
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

## TypeScript vs JavaScript

**TypeScript:** `<script setup lang="ts">`
**JavaScript:** `<script setup>`

## Output Format

1. Install commands for missing components
2. Complete SFC (`<script setup>` + `<template>`)
3. Brief explanation of transformations

## Validation Checklist

- [ ] All `<wa-*>` tags mapped to Kigumi components
- [ ] `class` used everywhere (no className)
- [ ] Events: `@wa-show` for overlays, `@input` for forms
- [ ] Slots: `<template #name>` or `slot="name"`
- [ ] PascalCase component names
- [ ] Imports use configured alias
- [ ] Missing components have install commands

## Event Listener Cleanup

When using template refs to call imperative methods or add native event listeners, always clean up:

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Dialog } from '@/components/ui';

const dialogRef = ref<HTMLElement | null>(null);

function handleAfterHide() {
  // Reset form state after dialog closes
}

onMounted(() => {
  dialogRef.value?.addEventListener('wa-after-hide', handleAfterHide);
});

onBeforeUnmount(() => {
  dialogRef.value?.removeEventListener('wa-after-hide', handleAfterHide);
});
</script>

<template>
  <Dialog ref="dialogRef" :open="open" @wa-hide="open = false"> ... </Dialog>
</template>
```

> Note: For most events, use `@wa-event` in the template. Use `addEventListener` in `onMounted` only when you need to call imperative methods like `.show()` or `.requestClose()` on the underlying web component.

## Troubleshooting

**Config not found:**

- Run `npx kigumi init` first to initialize the project

**Components not detected:**

- Verify `componentsDir` in `kigumi.config.json` points to correct location
- Ensure components are organized in subdirectories (e.g., `Button/Button.vue`)

**Wrong framework:**

- This skill only works for Vue projects
- Check `framework` field in `kigumi.config.json`
- For React projects, use the `kigumi-react` skill instead

**v-model not working:**

- WA components do NOT support `v-model`. Use `:value` + `@input` instead.

## References

- [Transformation Rules (Vue)](references/transformation-rules-vue.md) -- complete component mapping
- [Event Mapping (Vue)](references/event-mapping-vue.md) -- native vs custom events
- [Vue State Patterns](references/vue-state-patterns.md) -- ref, reactive, event handling
- [Component References](references/components/) -- per-component API docs (props, slots, events, CSS parts, methods)

## Related Skills

For multi-component composition patterns, use:

- **kigumi-compose-form** -- Build complete forms with validation and async submission
- **kigumi-compose-layout** -- Build page layouts using WA layout utilities
- **kigumi-compose-overlay** -- Build dialogs, drawers, dropdown menus, toasts
- **kigumi-compose-data** -- Build data tables, stats dashboards, list views
