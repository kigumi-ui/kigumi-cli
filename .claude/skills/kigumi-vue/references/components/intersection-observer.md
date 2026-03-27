# IntersectionObserver

**Web Awesome**: `wa-intersection-observer`  
**Kigumi Vue**: `<IntersectionObserver>`  
**Category**: Utilities  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-intersection-observer` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-intersection-observer disabled once>Click me</wa-intersection-observer>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { IntersectionObserver } from '@/components/ui';
</script>

<template>
  <IntersectionObserver disabled once> Click me </IntersectionObserver>
</template>
```

## Props

| Prop              | Type    | Values | Default | Description                              |
| ----------------- | ------- | ------ | ------- | ---------------------------------------- |
| `disabled`        | boolean | -      | `false` | Disables the observer                    |
| `once`            | boolean | -      | `false` | Stops observing after first intersection |
| `threshold`       | string  | -      | `0`     | Intersection thresholds                  |
| `root-margin`     | string  | -      | `0px`   | Root element margin                      |
| `intersect-class` | string  | -      | `-`     | CSS class to apply when intersecting     |

## Slots

| Slot        | Description                                                           |
| ----------- | --------------------------------------------------------------------- |
| _(default)_ | Elements to track. Only immediate children of the host are monitored. |

## Events

| Event          | Vue Handler     | Type          | Description                                                 |
| -------------- | --------------- | ------------- | ----------------------------------------------------------- |
| `wa-intersect` | `@wa-intersect` | `CustomEvent` | Fired when a tracked element begins or ceases intersecting. |

## Installation

```bash
npx kigumi add intersection-observer
```

---

**Documentation**: [webawesome.com/docs/components/intersection-observer](https://webawesome.com/docs/components/intersection-observer)
