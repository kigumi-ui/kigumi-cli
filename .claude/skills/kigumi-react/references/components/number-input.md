# NumberInput

**Web Awesome**: `wa-number-input`  
**Kigumi React**: `<NumberInput>`  
**Category**: Form Controls  
**Tier**: pro

React wrapper component for the Web Awesome `wa-number-input` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-number-input label="value" hint="value">Click me</wa-number-input>
```

```tsx
// Kigumi React
import { NumberInput } from '@/components/ui';

<NumberInput label="value" hint="value">
  Click me
</NumberInput>;
```

## Props

| Prop               | Type    | Values                                      | Default    | Description               |
| ------------------ | ------- | ------------------------------------------- | ---------- | ------------------------- |
| `label`            | string  | -                                           | `-`        | Accessible label          |
| `hint`             | string  | -                                           | `-`        | Descriptive hint text     |
| `value`            | number  | -                                           | `-`        | Current value             |
| `min`              | number  | -                                           | `-`        | Minimum value             |
| `max`              | number  | -                                           | `-`        | Maximum value             |
| `step`             | number  | -                                           | `1`        | Step increment            |
| `disabled`         | boolean | -                                           | `false`    | Disables the input        |
| `required`         | boolean | -                                           | `false`    | Makes field mandatory     |
| `placeholder`      | string  | -                                           | `-`        | Placeholder text          |
| `size`             | string  | 'small' \| 'medium' \| 'large'              | `medium`   | Input size                |
| `appearance`       | string  | 'filled' \| 'outlined' \| 'filled-outlined' | `outlined` | Visual appearance         |
| `without-steppers` | boolean | -                                           | `false`    | Hides the stepper buttons |

## Slots

| Slot             | Description                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `label`          | The input's label. Alternatively, you can use the `label` attribute.                       |
| `start`          | An element, such as `<wa-icon>`, placed at the start of the input control.                 |
| `end`            | An element, such as `<wa-icon>`, placed at the end of the input control (before steppers). |
| `increment-icon` | An icon to use in lieu of the default increment icon.                                      |
| `decrement-icon` | An icon to use in lieu of the default decrement icon.                                      |
| `hint`           | Text that describes how to use the input. Alternatively, you can use the `hint` attribute. |

## Events

| Event        | React Handler | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `input`      | `onInput`     | `InputEvent`  | Emitted when the control receives input.                                                          |
| `change`     | `onChange`    | `Event`       | Emitted when an alteration to the control's value is committed by the user.                       |
| `blur`       | `onBlur`      | `FocusEvent`  | Emitted when the control loses focus.                                                             |
| `focus`      | `onFocus`     | `FocusEvent`  | Emitted when the control gains focus.                                                             |
| `wa-invalid` | `onWaInvalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part                 | Description                                    |
| -------------------- | ---------------------------------------------- |
| `label`              | The label element.                             |
| `form-control-label` | Alias for the label element.                   |
| `hint`               | The hint element.                              |
| `base`               | The wrapper containing the input and steppers. |
| `input`              | The internal `<input>` control.                |
| `start`              | The container that wraps the `start` slot.     |
| `end`                | The container that wraps the `end` slot.       |
| `stepper`            | Both stepper buttons (for shared styling).     |
| `stepper-increment`  | The increment (+) button on the end side.      |
| `stepper-decrement`  | The decrement (-) button on the start side.    |

## Methods

| Method       | Parameters              | Description                              |
| ------------ | ----------------------- | ---------------------------------------- |
| `focus()`    | `options: FocusOptions` | Sets focus on the input.                 |
| `blur()`     | -                       | Removes focus from the input.            |
| `select()`   | -                       | Selects all the text in the input.       |
| `stepUp()`   | -                       | Increments the value by the step amount. |
| `stepDown()` | -                       | Decrements the value by the step amount. |

## Installation

```bash
npx kigumi add number-input
```

---

**Documentation**: [webawesome.com/docs/components/number-input](https://webawesome.com/docs/components/number-input)
