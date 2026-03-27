# Checkbox

**Web Awesome**: `wa-checkbox`  
**Kigumi React**: `<Checkbox>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-checkbox` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-checkbox checked disabled>Click me</wa-checkbox>
```

```tsx
// Kigumi React
import { Checkbox } from '@/components/ui';

<Checkbox checked={true} disabled={true}>
  Click me
</Checkbox>;
```

## Props

| Prop            | Type    | Values                         | Default  | Description                     |
| --------------- | ------- | ------------------------------ | -------- | ------------------------------- |
| `checked`       | boolean | -                              | `false`  | Draws checkbox in checked state |
| `disabled`      | boolean | -                              | `false`  | Disables the checkbox           |
| `hint`          | string  | -                              | `''`     | Descriptive helper text         |
| `indeterminate` | boolean | -                              | `false`  | Mixed/parent selection state    |
| `name`          | string  | -                              | `''`     | Form submission identifier      |
| `required`      | boolean | -                              | `false`  | Makes field mandatory           |
| `size`          | string  | 'small' \| 'medium' \| 'large' | `medium` | Adjusts checkbox dimensions     |
| `value`         | string  | -                              | `-`      | Form submission value           |

## Slots

| Slot        | Description                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| _(default)_ | The checkbox's label.                                                                         |
| `hint`      | Text that describes how to use the checkbox. Alternatively, you can use the `hint` attribute. |

## Events

| Event        | React Handler | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `change`     | `onChange`    | `Event`       | Emitted when the checked state changes.                                                           |
| `blur`       | `onBlur`      | `FocusEvent`  | Emitted when the checkbox loses focus.                                                            |
| `focus`      | `onFocus`     | `FocusEvent`  | Emitted when the checkbox gains focus.                                                            |
| `input`      | `onInput`     | `InputEvent`  | Emitted when the checkbox receives input.                                                         |
| `wa-invalid` | `onWaInvalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part                 | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `base`               | The component's label .                                       |
| `control`            | The square container that wraps the checkbox's checked state. |
| `checked-icon`       | The checked icon, a `<wa-icon>` element.                      |
| `indeterminate-icon` | The indeterminate icon, a `<wa-icon>` element.                |
| `label`              | The container that wraps the checkbox's label.                |
| `hint`               | The hint's wrapper.                                           |

## CSS Custom Properties

| Property               | Default | Description                                                               |
| ---------------------- | ------- | ------------------------------------------------------------------------- |
| `--checked-icon-color` | -       | The color of the checked and indeterminate icons.                         |
| `--checked-icon-scale` | -       | The size of the checked and indeterminate icons relative to the checkbox. |

## Methods

| Method    | Parameters              | Description                        |
| --------- | ----------------------- | ---------------------------------- |
| `click()` | -                       | Simulates a click on the checkbox. |
| `focus()` | `options: FocusOptions` | Sets focus on the checkbox.        |
| `blur()`  | -                       | Removes focus from the checkbox.   |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add checkbox
```

---

**Documentation**: [webawesome.com/docs/components/checkbox](https://webawesome.com/docs/components/checkbox)
