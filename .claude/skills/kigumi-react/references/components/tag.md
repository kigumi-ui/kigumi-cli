# Tag

**Web Awesome**: `wa-tag`  
**Kigumi React**: `<Tag>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-tag` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tag appearance="accent" pill>Click me</wa-tag>
```

```tsx
// Kigumi React
import { Tag } from '@/components/ui';

<Tag appearance="accent" pill={true}>
  Click me
</Tag>;
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

| Event       | React Handler | Type          | Description                                  |
| ----------- | ------------- | ------------- | -------------------------------------------- |
| `wa-remove` | `onWaRemove`  | `CustomEvent` | Emitted when the remove button is activated. |

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
