# Popover

**Web Awesome**: `wa-popover`  
**Kigumi Vue**: `<Popover>`  
**Category**: Overlays  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-popover` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-popover open disabled>Click me</wa-popover>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Popover } from '@/components/ui';
</script>

<template>
  <Popover open disabled> Click me </Popover>
</template>
```

## Props

| Prop            | Type    | Values                                                                                                                                                             | Default | Description                                      |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------------------ |
| `open`          | boolean | -                                                                                                                                                                  | `false` | Indicates whether the popover is open            |
| `disabled`      | boolean | -                                                                                                                                                                  | `false` | Disables the popover                             |
| `placement`     | string  | 'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'right' \| 'right-start' \| 'right-end' \| 'left' \| 'left-start' \| 'left-end' | `top`   | Preferred placement                              |
| `trigger`       | string  | -                                                                                                                                                                  | `click` | Activation events (click, hover, focus)          |
| `distance`      | number  | -                                                                                                                                                                  | `8`     | Distance from trigger                            |
| `skidding`      | number  | -                                                                                                                                                                  | `0`     | Offset along trigger                             |
| `with-arrow`    | boolean | -                                                                                                                                                                  | `false` | Shows an arrow                                   |
| `without-arrow` | boolean | -                                                                                                                                                                  | `false` | Hides the arrow                                  |
| `for`           | string  | -                                                                                                                                                                  | `-`     | The ID of the element the popover is anchored to |

## Slots

| Slot        | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| _(default)_ | The popover's content. Interactive elements such as buttons and links are supported. |

## Events

| Event           | Vue Handler      | Type          | Description                                                                                       |
| --------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `wa-show`       | `@wa-show`       | `CustomEvent` | Emitted when the popover begins to show. Canceling this event will stop the popover from showing. |
| `wa-after-show` | `@wa-after-show` | `CustomEvent` | Emitted after the popover has shown and all animations are complete.                              |
| `wa-hide`       | `@wa-hide`       | `CustomEvent` | Emitted when the popover begins to hide. Canceling this event will stop the popover from hiding.  |
| `wa-after-hide` | `@wa-after-hide` | `CustomEvent` | Emitted after the popover has hidden and all animations are complete.                             |

## CSS Parts

| Part           | Description                                                                          |
| -------------- | ------------------------------------------------------------------------------------ |
| `dialog`       | The native dialog element that contains the popover content.                         |
| `body`         | The popover's body where its content is rendered.                                    |
| `popup`        | The internal `<wa-popup>` element that positions the popover.                        |
| `popup__popup` | The popup's exported `popup` part. Use this to target the popover's popup container. |
| `popup__arrow` | The popup's exported `arrow` part. Use this to target the popover's arrow.           |

## CSS Custom Properties

| Property          | Default    | Description                                                                    |
| ----------------- | ---------- | ------------------------------------------------------------------------------ |
| `--arrow-size`    | `0.375rem` | The size of the tiny arrow that points to the popover (set to zero to remove). |
| `--max-width`     | `25rem`    | The maximum width of the popover's body content.                               |
| `--show-duration` | `100ms`    | The speed of the show animation.                                               |
| `--hide-duration` | `100ms`    | The speed of the hide animation.                                               |

## Methods

| Method   | Parameters | Description        |
| -------- | ---------- | ------------------ |
| `show()` | -          | Shows the popover. |
| `hide()` | -          | Hides the popover. |

## Dependencies

This component requires:

- [`Popup`](popup.md)

## Installation

```bash
npx kigumi add popover
```

---

**Documentation**: [webawesome.com/docs/components/popover](https://webawesome.com/docs/components/popover)
