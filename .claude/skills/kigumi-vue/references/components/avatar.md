# Avatar

**Web Awesome**: `wa-avatar`  
**Kigumi Vue**: `<Avatar>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-avatar` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-avatar image="''" label="''">Click me</wa-avatar>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Avatar } from '@/components/ui';
</script>

<template>
  <Avatar image="''" label="''"> Click me </Avatar>
</template>
```

## Props

| Prop       | Type   | Values                            | Default  | Description                                                |
| ---------- | ------ | --------------------------------- | -------- | ---------------------------------------------------------- |
| `image`    | string | -                                 | `''`     | The image source to use for the avatar                     |
| `label`    | string | -                                 | `''`     | A label to use to describe the avatar to assistive devices |
| `initials` | string | -                                 | `''`     | Initials to use as a fallback when no image is available   |
| `loading`  | string | 'eager' \| 'lazy'                 | `eager`  | Indicates how the browser should load the image            |
| `shape`    | string | 'circle' \| 'square' \| 'rounded' | `circle` | The shape of the avatar                                    |

## Slots

| Slot   | Description                                                                                 |
| ------ | ------------------------------------------------------------------------------------------- |
| `icon` | The default icon to use when no image or initials are present. Works best with `<wa-icon>`. |

## Events

| Event      | Vue Handler | Type          | Description                                                                                                              |
| ---------- | ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `wa-error` | `@wa-error` | `CustomEvent` | The image could not be loaded. This may because of an invalid URL, a temporary network condition, or some unknown cause. |

## CSS Parts

| Part       | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| `icon`     | The container that wraps the avatar's icon.                     |
| `initials` | The container that wraps the avatar's initials.                 |
| `image`    | The avatar image. Only shown when the `image` attribute is set. |

## CSS Custom Properties

| Property | Default | Description             |
| -------- | ------- | ----------------------- |
| `--size` | -       | The size of the avatar. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add avatar
```

---

**Documentation**: [webawesome.com/docs/components/avatar](https://webawesome.com/docs/components/avatar)
