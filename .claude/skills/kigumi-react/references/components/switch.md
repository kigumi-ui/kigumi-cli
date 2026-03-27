# Switch

**Web Awesome**: `wa-switch`  
**Kigumi React**: `<Switch>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-switch` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-switch name="value" value="value">Click me</wa-switch>
```

```tsx
// Kigumi React
import { Switch } from '@/components/ui';

<Switch name="value" value="value">
  Click me
</Switch>;
```

## Props

| Prop       | Type    | Values                         | Default  | Description               |
| ---------- | ------- | ------------------------------ | -------- | ------------------------- |
| `name`     | string  | -                              | `-`      | Form field name           |
| `value`    | string  | -                              | `-`      | Form value when checked   |
| `size`     | string  | 'small' \| 'medium' \| 'large' | `medium` | Switch size               |
| `disabled` | boolean | -                              | `false`  | Disables the switch       |
| `checked`  | boolean | -                              | `false`  | Whether the switch is on  |
| `required` | boolean | -                              | `false`  | Makes the switch required |
| `hint`     | string  | -                              | `''`     | Hint text                 |

## Slots

| Slot        | Description                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------- |
| _(default)_ | The switch's label.                                                                         |
| `hint`      | Text that describes how to use the switch. Alternatively, you can use the `hint` attribute. |

## Events

| Event        | React Handler | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `change`     | `onChange`    | `Event`       | Emitted when the control's checked state changes.                                                 |
| `input`      | `onInput`     | `InputEvent`  | Emitted when the control receives input.                                                          |
| `blur`       | `onBlur`      | `FocusEvent`  | Emitted when the control loses focus.                                                             |
| `focus`      | `onFocus`     | `FocusEvent`  | Emitted when the control gains focus.                                                             |
| `wa-invalid` | `onWaInvalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part      | Description                                 |
| --------- | ------------------------------------------- |
| `base`    | The component's base wrapper.               |
| `control` | The control that houses the switch's thumb. |
| `thumb`   | The switch's thumb.                         |
| `label`   | The switch's label.                         |
| `hint`    | The hint's wrapper.                         |

## CSS Custom Properties

| Property       | Default | Description               |
| -------------- | ------- | ------------------------- |
| `--width`      | -       | The width of the switch.  |
| `--height`     | -       | The height of the switch. |
| `--thumb-size` | -       | The size of the thumb.    |

## Methods

| Method    | Parameters              | Description                      |
| --------- | ----------------------- | -------------------------------- |
| `click()` | -                       | Simulates a click on the switch. |
| `focus()` | `options: FocusOptions` | Sets focus on the switch.        |
| `blur()`  | -                       | Removes focus from the switch.   |

## Installation

```bash
npx kigumi add switch
```

---

**Documentation**: [webawesome.com/docs/components/switch](https://webawesome.com/docs/components/switch)
