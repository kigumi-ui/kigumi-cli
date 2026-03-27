# AnimatedImage

**Web Awesome**: `wa-animated-image`  
**Kigumi Vue**: `<AnimatedImage>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-animated-image` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-animated-image src="value" alt="value">Click me</wa-animated-image>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { AnimatedImage } from '@/components/ui';
</script>

<template>
  <AnimatedImage src="value" alt="value"> Click me </AnimatedImage>
</template>
```

## Props

| Prop   | Type    | Values | Default | Description                                                                   |
| ------ | ------- | ------ | ------- | ----------------------------------------------------------------------------- |
| `src`  | string  | -      | `-`     | The path to the image to load                                                 |
| `alt`  | string  | -      | `-`     | A description of the image used by assistive devices                          |
| `play` | boolean | -      | `false` | Plays the animation. When this attribute is removed, the animation will pause |

## Slots

| Slot         | Description                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| `play-icon`  | Optional play icon to use instead of the default. Works best with `<wa-icon>`.  |
| `pause-icon` | Optional pause icon to use instead of the default. Works best with `<wa-icon>`. |

## Events

| Event      | Vue Handler | Type          | Description                                |
| ---------- | ----------- | ------------- | ------------------------------------------ |
| `wa-load`  | `@wa-load`  | `CustomEvent` | Emitted when the image loads successfully. |
| `wa-error` | `@wa-error` | `CustomEvent` | Emitted when the image fails to load.      |

## CSS Parts

| Part          | Description                                                                      |
| ------------- | -------------------------------------------------------------------------------- |
| `control-box` | The container that surrounds the pause/play icons and provides their background. |

## CSS Custom Properties

| Property             | Default | Description                       |
| -------------------- | ------- | --------------------------------- |
| `--control-box-size` | -       | The size of the icon box.         |
| `--icon-size`        | -       | The size of the play/pause icons. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add animated-image
```

---

**Documentation**: [webawesome.com/docs/components/animated-image](https://webawesome.com/docs/components/animated-image)
