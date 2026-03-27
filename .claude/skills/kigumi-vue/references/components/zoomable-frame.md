# ZoomableFrame

**Web Awesome**: `wa-zoomable-frame`  
**Kigumi Vue**: `<ZoomableFrame>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-zoomable-frame` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-zoomable-frame src="value" srcdoc="value">Click me</wa-zoomable-frame>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { ZoomableFrame } from '@/components/ui';
</script>

<template>
  <ZoomableFrame src="value" srcdoc="value"> Click me </ZoomableFrame>
</template>
```

## Props

| Prop                  | Type    | Values            | Default                                | Description               |
| --------------------- | ------- | ----------------- | -------------------------------------- | ------------------------- |
| `src`                 | string  | -                 | `-`                                    | URL of content to display |
| `srcdoc`              | string  | -                 | `-`                                    | Inline HTML to render     |
| `zoom`                | number  | -                 | `1`                                    | Current zoom level        |
| `zoom-levels`         | string  | -                 | `25% 50% 75% 100% 125% 150% 175% 200%` | Available zoom levels     |
| `allowfullscreen`     | boolean | -                 | `false`                                | Enables fullscreen        |
| `loading`             | string  | 'eager' \| 'lazy' | `eager`                                | Loading behavior          |
| `without-controls`    | boolean | -                 | `false`                                | Hides zoom controls       |
| `without-interaction` | boolean | -                 | `false`                                | Disables interaction      |
| `sandbox`             | string  | -                 | `-`                                    | Security restrictions     |
| `referrerpolicy`      | string  | -                 | `-`                                    | Referrer policy           |

## Slots

| Slot            | Description                               |
| --------------- | ----------------------------------------- |
| `zoom-in-icon`  | The slot that contains the zoom in icon.  |
| `zoom-out-icon` | The slot that contains the zoom out icon. |

## Events

| Event   | Vue Handler | Type    | Description                                                |
| ------- | ----------- | ------- | ---------------------------------------------------------- |
| `load`  | `@load`     | `Event` | Emitted when the internal iframe when it finishes loading. |
| `error` | `@error`    | `Event` | Emitted from the internal iframe when it fails to load.    |

## CSS Parts

| Part              | Description                                        |
| ----------------- | -------------------------------------------------- |
| `iframe`          | The internal `<iframe>` element.                   |
| `controls`        | The container that surrounds zoom control buttons. |
| `zoom-in-button`  | The zoom in button.                                |
| `zoom-out-button` | The zoom out button.                               |

## Methods

| Method      | Parameters | Description                                     |
| ----------- | ---------- | ----------------------------------------------- |
| `zoomIn()`  | -          | Zooms in to the next available zoom level.      |
| `zoomOut()` | -          | Zooms out to the previous available zoom level. |

## Dependencies

This component requires:

- [`ButtonGroup`](button-group.md)
- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add zoomable-frame
```

---

**Documentation**: [webawesome.com/docs/components/zoomable-frame](https://webawesome.com/docs/components/zoomable-frame)
