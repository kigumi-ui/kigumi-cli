# Callout

**Web Awesome**: `wa-callout`  
**Kigumi Vue**: `<Callout>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-callout` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-callout appearance="accent" size="small">Click me</wa-callout>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Callout } from '@/components/ui';
</script>

<template>
  <Callout appearance="accent" size="small"> Click me </Callout>
</template>
```

## Props

| Prop         | Type   | Values                                                             | Default           | Description                     |
| ------------ | ------ | ------------------------------------------------------------------ | ----------------- | ------------------------------- |
| `appearance` | string | 'accent' \| 'filled' \| 'outlined' \| 'plain' \| 'filled-outlined' | `filled-outlined` | The callout's visual appearance |
| `size`       | string | 'small' \| 'medium' \| 'large'                                     | `medium`          | The callout's size              |
| `variant`    | string | 'brand' \| 'neutral' \| 'success' \| 'warning' \| 'danger'         | `brand`           | The callout's theme variant     |

## Slots

| Slot        | Description                                                  |
| ----------- | ------------------------------------------------------------ |
| _(default)_ | The callout's main content.                                  |
| `icon`      | An icon to show in the callout. Works best with `<wa-icon>`. |

## CSS Parts

| Part      | Description                                          |
| --------- | ---------------------------------------------------- |
| `icon`    | The container that wraps the optional icon.          |
| `message` | The container that wraps the callout's main content. |

## Installation

```bash
npx kigumi add callout
```

---

**Documentation**: [webawesome.com/docs/components/callout](https://webawesome.com/docs/components/callout)
