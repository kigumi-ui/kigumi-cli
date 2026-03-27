# Animation

**Web Awesome**: `wa-animation`  
**Kigumi Vue**: `<Animation>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-animation` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-animation name="none" play>Click me</wa-animation>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Animation } from '@/components/ui';
</script>

<template>
  <Animation name="none" play> Click me </Animation>
</template>
```

## Props

| Prop              | Type    | Values                                                      | Default    | Description                                                      |
| ----------------- | ------- | ----------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `name`            | string  | -                                                           | `none`     | The name of the built-in animation to use                        |
| `play`            | boolean | -                                                           | `false`    | Plays the animation. When omitted, the animation will be paused  |
| `delay`           | number  | -                                                           | `0`        | The number of milliseconds to delay the start of the animation   |
| `direction`       | string  | 'normal' \| 'reverse' \| 'alternate' \| 'alternate-reverse' | `normal`   | Determines the direction of playback                             |
| `duration`        | number  | -                                                           | `1000`     | The number of milliseconds each iteration takes to complete      |
| `easing`          | string  | -                                                           | `linear`   | The easing function to use                                       |
| `end-delay`       | number  | -                                                           | `0`        | The number of milliseconds to delay after the active period      |
| `fill`            | string  | 'auto' \| 'backwards' \| 'both' \| 'forwards' \| 'none'     | `auto`     | Sets how the animation applies styles before and after execution |
| `iterations`      | number  | -                                                           | `Infinity` | The number of iterations to run before completing                |
| `iteration-start` | number  | -                                                           | `0`        | The offset at which to start the animation                       |
| `playback-rate`   | number  | -                                                           | `1`        | Sets the animation's playback rate                               |

## Slots

| Slot        | Description                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(default)_ | The element to animate. Avoid slotting in more than one element, as subsequent ones will be ignored. To animate multiple elements, either wrap them in a single container or use multiple `<wa-animation>` elements. |

## Events

| Event       | Vue Handler  | Type          | Description                                    |
| ----------- | ------------ | ------------- | ---------------------------------------------- |
| `wa-cancel` | `@wa-cancel` | `CustomEvent` | Emitted when the animation is canceled.        |
| `wa-finish` | `@wa-finish` | `CustomEvent` | Emitted when the animation finishes.           |
| `wa-start`  | `@wa-start`  | `CustomEvent` | Emitted when the animation starts or restarts. |

## Methods

| Method     | Parameters | Description                                                                                         |
| ---------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `cancel()` | -          | Clears all keyframe effects caused by this animation and aborts its playback.                       |
| `finish()` | -          | Sets the playback time to the end of the animation corresponding to the current playback direction. |

## Installation

```bash
npx kigumi add animation
```

---

**Documentation**: [webawesome.com/docs/components/animation](https://webawesome.com/docs/components/animation)
