# MutationObserver

**Web Awesome**: `wa-mutation-observer`  
**Kigumi Vue**: `<MutationObserver>`  
**Category**: Utilities  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-mutation-observer` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-mutation-observer attr="value" attr-old-value
  >Click me</wa-mutation-observer
>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { MutationObserver } from '@/components/ui';
</script>

<template>
  <MutationObserver attr="value" attr-old-value> Click me </MutationObserver>
</template>
```

## Props

| Prop                  | Type    | Values | Default | Description                                   |
| --------------------- | ------- | ------ | ------- | --------------------------------------------- |
| `attr`                | string  | -      | `-`     | Space-separated list of attributes to observe |
| `attr-old-value`      | boolean | -      | `false` | Records previous attribute values             |
| `char-data`           | boolean | -      | `false` | Observes character data changes               |
| `char-data-old-value` | boolean | -      | `false` | Records previous character data               |
| `child-list`          | boolean | -      | `false` | Observes child node changes                   |
| `disabled`            | boolean | -      | `false` | Disables the observer                         |
| `subtree`             | boolean | -      | `false` | Observes changes in subtree                   |

## Slots

| Slot        | Description                         |
| ----------- | ----------------------------------- |
| _(default)_ | The content to watch for mutations. |

## Events

| Event         | Vue Handler    | Type          | Description                     |
| ------------- | -------------- | ------------- | ------------------------------- |
| `wa-mutation` | `@wa-mutation` | `CustomEvent` | Emitted when a mutation occurs. |

## Installation

```bash
npx kigumi add mutation-observer
```

---

**Documentation**: [webawesome.com/docs/components/mutation-observer](https://webawesome.com/docs/components/mutation-observer)
