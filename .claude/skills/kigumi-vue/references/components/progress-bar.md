# ProgressBar

**Web Awesome**: `wa-progress-bar`  
**Kigumi Vue**: `<ProgressBar>`  
**Category**: Progress  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-progress-bar` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-progress-bar value="0" indeterminate>Click me</wa-progress-bar>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { ProgressBar } from '@/components/ui';
</script>

<template>
  <ProgressBar value="0" indeterminate> Click me </ProgressBar>
</template>
```

## Props

| Prop            | Type    | Values | Default | Description               |
| --------------- | ------- | ------ | ------- | ------------------------- |
| `value`         | number  | -      | `0`     | Current progress (0-100)  |
| `indeterminate` | boolean | -      | `false` | Shows indeterminate state |
| `label`         | string  | -      | `''`    | Accessible label          |

## Slots

| Slot        | Description                                    |
| ----------- | ---------------------------------------------- |
| _(default)_ | A label to show inside the progress indicator. |

## CSS Parts

| Part        | Description                   |
| ----------- | ----------------------------- |
| `base`      | The component's base wrapper. |
| `indicator` | The progress bar's indicator. |
| `label`     | The progress bar's label.     |

## CSS Custom Properties

| Property            | Default                               | Description                 |
| ------------------- | ------------------------------------- | --------------------------- |
| `--track-height`    | `1rem`                                | The color of the track.     |
| `--track-color`     | `var(--wa-color-neutral-fill-normal)` | The color of the track.     |
| `--indicator-color` | `var(--wa-color-brand-fill-loud)`     | The color of the indicator. |

## Installation

```bash
npx kigumi add progress-bar
```

---

**Documentation**: [webawesome.com/docs/components/progress-bar](https://webawesome.com/docs/components/progress-bar)
