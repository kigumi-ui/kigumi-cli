# TabPanel

**Web Awesome**: `wa-tab-panel`  
**Kigumi Vue**: `<TabPanel>`  
**Category**: Navigation  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-tab-panel` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tab-panel name="''" active>Click me</wa-tab-panel>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { TabPanel } from '@/components/ui';
</script>

<template>
  <TabPanel name="''" active> Click me </TabPanel>
</template>
```

## Props

| Prop     | Type    | Values | Default | Description                |
| -------- | ------- | ------ | ------- | -------------------------- |
| `name`   | string  | -      | `''`    | The panel name             |
| `active` | boolean | -      | `false` | Whether the panel is shown |

## Slots

| Slot        | Description              |
| ----------- | ------------------------ |
| _(default)_ | The tab panel's content. |

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## CSS Custom Properties

| Property    | Default | Description              |
| ----------- | ------- | ------------------------ |
| `--padding` | -       | The tab panel's padding. |

## Installation

```bash
npx kigumi add tab-panel
```

---

**Documentation**: [webawesome.com/docs/components/tab-panel](https://webawesome.com/docs/components/tab-panel)
