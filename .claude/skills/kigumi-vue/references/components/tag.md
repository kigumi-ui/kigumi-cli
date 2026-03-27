# Tag

**Web Awesome**: `wa-tag`  
**Kigumi Vue**: `<Tag>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-tag` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tag appearance="accent" pill>Click me</wa-tag>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Tag } from '@/components/ui';
</script>

<template>
  <Tag appearance="accent" pill> Click me </Tag>
</template>
```

## Props

| Prop          | Type    | Values                                                     | Default           | Description         |
| ------------- | ------- | ---------------------------------------------------------- | ----------------- | ------------------- |
| `appearance`  | string  | 'accent' \| 'filled' \| 'outlined' \| 'filled-outlined'    | `filled-outlined` | Visual appearance   |
| `pill`        | boolean | -                                                          | `false`           | Rounded edges       |
| `size`        | string  | 'small' \| 'medium' \| 'large'                             | `medium`          | Tag size            |
| `variant`     | string  | 'brand' \| 'neutral' \| 'success' \| 'warning' \| 'danger' | `neutral`         | Theme variant       |
| `with-remove` | boolean | -                                                          | `false`           | Shows remove button |

## Slots

| Slot        | Description        |
| ----------- | ------------------ |
| _(default)_ | The tag's content. |

## Events

| Event       | Vue Handler  | Type          | Description                                  |
| ----------- | ------------ | ------------- | -------------------------------------------- |
| `wa-remove` | `@wa-remove` | `CustomEvent` | Emitted when the remove button is activated. |

## CSS Parts

| Part                  | Description                               |
| --------------------- | ----------------------------------------- |
| `base`                | The component's base wrapper.             |
| `content`             | The tag's content.                        |
| `remove-button`       | The tag's remove button, a `<wa-button>`. |
| `remove-button__base` | The remove button's exported `base` part. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add tag
```

---

**Documentation**: [webawesome.com/docs/components/tag](https://webawesome.com/docs/components/tag)
