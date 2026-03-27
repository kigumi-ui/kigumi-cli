# Radio

**Web Awesome**: `wa-radio`  
**Kigumi React**: `<Radio>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-radio` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-radio value="value" disabled>Click me</wa-radio>
```

```tsx
// Kigumi React
import { Radio } from '@/components/ui';

<Radio value="value" disabled={true}>
  Click me
</Radio>;
```

## Props

| Prop         | Type    | Values                         | Default   | Description            |
| ------------ | ------- | ------------------------------ | --------- | ---------------------- |
| `value`      | string  | -                              | `-`       | The radio value        |
| `disabled`   | boolean | -                              | `false`   | Disables the radio     |
| `size`       | string  | 'small' \| 'medium' \| 'large' | `medium`  | Radio size             |
| `appearance` | string  | 'default' \| 'button'          | `default` | Radio appearance style |

## Slots

| Slot        | Description        |
| ----------- | ------------------ |
| _(default)_ | The radio's label. |

## Events

| Event   | React Handler | Type         | Description                           |
| ------- | ------------- | ------------ | ------------------------------------- |
| `blur`  | `onBlur`      | `FocusEvent` | Emitted when the control loses focus. |
| `focus` | `onFocus`     | `FocusEvent` | Emitted when the control gains focus. |

## CSS Parts

| Part           | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `control`      | The circular container that wraps the radio's checked state. |
| `checked-icon` | The checked icon.                                            |
| `label`        | The container that wraps the radio's label.                  |

## CSS Custom Properties

| Property               | Default | Description                                         |
| ---------------------- | ------- | --------------------------------------------------- |
| `--checked-icon-color` | -       | The color of the checked icon.                      |
| `--checked-icon-scale` | -       | The size of the checked icon relative to the radio. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add radio
```

---

**Documentation**: [webawesome.com/docs/components/radio](https://webawesome.com/docs/components/radio)
