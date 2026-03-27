# Tab

**Web Awesome**: `wa-tab`  
**Kigumi Vue**: `<Tab>`  
**Category**: Navigation  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-tab` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tab panel="value" disabled>Click me</wa-tab>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Tab } from '@/components/ui';
</script>

<template>
  <Tab panel="value" disabled> Click me </Tab>
</template>
```

## Props

| Prop       | Type    | Values | Default | Description           |
| ---------- | ------- | ------ | ------- | --------------------- |
| `panel`    | string  | -      | `-`     | Associated panel name |
| `disabled` | boolean | -      | `false` | Disables the tab      |

## Slots

| Slot        | Description      |
| ----------- | ---------------- |
| _(default)_ | The tab's label. |

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add tab
```

---

**Documentation**: [webawesome.com/docs/components/tab](https://webawesome.com/docs/components/tab)
