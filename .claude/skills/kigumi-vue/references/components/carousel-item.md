# CarouselItem

**Web Awesome**: `wa-carousel-item`  
**Kigumi Vue**: `<CarouselItem>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-carousel-item` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-carousel-item>Click me</wa-carousel-item>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { CarouselItem } from '@/components/ui';
</script>

<template>
  <CarouselItem> Click me </CarouselItem>
</template>
```

## Slots

| Slot        | Description                   |
| ----------- | ----------------------------- |
| _(default)_ | The carousel item's content.. |

## CSS Custom Properties

| Property         | Default | Description                                                       |
| ---------------- | ------- | ----------------------------------------------------------------- |
| `--aspect-ratio` | -       | The slide's aspect ratio. Inherited from the carousel by default. |

## Installation

```bash
npx kigumi add carousel-item
```

---

**Documentation**: [webawesome.com/docs/components/carousel-item](https://webawesome.com/docs/components/carousel-item)
