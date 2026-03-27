# Event Mapping (Vue)

Web Awesome components use two different event systems. Vue uses `@event-name` syntax for both.

## Native DOM Events

Form controls (`wa-input`, `wa-select`, `wa-checkbox`, etc.) emit native browser events.

| Web Awesome Event | Vue Handler | Type         |
| ----------------- | ----------- | ------------ |
| `blur`            | `@blur`     | `FocusEvent` |
| `change`          | `@change`   | `Event`      |
| `error`           | `@error`    | `Event`      |
| `focus`           | `@focus`    | `FocusEvent` |
| `input`           | `@input`    | `InputEvent` |
| `load`            | `@load`     | `Event`      |

```vue
<script setup lang="ts">
import { Input } from '@/components/ui';

function handleInput(e: Event) {
  console.log((e.target as HTMLInputElement).value);
}
</script>

<template>
  <Input @input="handleInput" @change="handleInput" />
</template>
```

## Custom `wa-` Events

Overlay and complex components emit custom events prefixed with `wa-`.

| Web Awesome Event     | Vue Handler            | Type          |
| --------------------- | ---------------------- | ------------- |
| `wa-after-collapse`   | `@wa-after-collapse`   | `CustomEvent` |
| `wa-after-expand`     | `@wa-after-expand`     | `CustomEvent` |
| `wa-after-hide`       | `@wa-after-hide`       | `CustomEvent` |
| `wa-after-show`       | `@wa-after-show`       | `CustomEvent` |
| `wa-cancel`           | `@wa-cancel`           | `CustomEvent` |
| `wa-clear`            | `@wa-clear`            | `CustomEvent` |
| `wa-collapse`         | `@wa-collapse`         | `CustomEvent` |
| `wa-copy`             | `@wa-copy`             | `CustomEvent` |
| `wa-create`           | `@wa-create`           | `CustomEvent` |
| `wa-error`            | `@wa-error`            | `CustomEvent` |
| `wa-expand`           | `@wa-expand`           | `CustomEvent` |
| `wa-finish`           | `@wa-finish`           | `CustomEvent` |
| `wa-hide`             | `@wa-hide`             | `CustomEvent` |
| `wa-hover`            | `@wa-hover`            | `CustomEvent` |
| `wa-include-error`    | `@wa-include-error`    | `CustomEvent` |
| `wa-intersect`        | `@wa-intersect`        | `CustomEvent` |
| `wa-invalid`          | `@wa-invalid`          | `CustomEvent` |
| `wa-lazy-change`      | `@wa-lazy-change`      | `CustomEvent` |
| `wa-lazy-load`        | `@wa-lazy-load`        | `CustomEvent` |
| `wa-load`             | `@wa-load`             | `CustomEvent` |
| `wa-mutation`         | `@wa-mutation`         | `CustomEvent` |
| `wa-remove`           | `@wa-remove`           | `CustomEvent` |
| `wa-reposition`       | `@wa-reposition`       | `CustomEvent` |
| `wa-resize`           | `@wa-resize`           | `CustomEvent` |
| `wa-select`           | `@wa-select`           | `CustomEvent` |
| `wa-selection-change` | `@wa-selection-change` | `CustomEvent` |
| `wa-show`             | `@wa-show`             | `CustomEvent` |
| `wa-slide-change`     | `@wa-slide-change`     | `CustomEvent` |
| `wa-start`            | `@wa-start`            | `CustomEvent` |
| `wa-tab-hide`         | `@wa-tab-hide`         | `CustomEvent` |
| `wa-tab-show`         | `@wa-tab-show`         | `CustomEvent` |

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Dialog, Button } from '@/components/ui';

const isOpen = ref(false);
</script>

<template>
  <Button @click="isOpen = true">Open Dialog</Button>
  <Dialog
    :open="isOpen"
    @wa-hide="isOpen = false"
    @wa-after-show="console.log('Dialog shown')"
  >
    Dialog content
  </Dialog>
</template>
```
