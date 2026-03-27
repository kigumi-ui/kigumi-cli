# Button

**Web Awesome**: `wa-button`  
**Kigumi React**: `<Button>`  
**Category**: Actions  
**Tier**: free

React wrapper component for the Web Awesome `wa-button` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-button variant="neutral" appearance="accent">Click me</wa-button>
```

```tsx
// Kigumi React
import { Button } from '@/components/ui';

<Button variant="neutral" appearance="accent">
  Click me
</Button>;
```

## Props

| Prop             | Type    | Values                                                             | Default   | Description                                     |
| ---------------- | ------- | ------------------------------------------------------------------ | --------- | ----------------------------------------------- |
| `variant`        | string  | 'neutral' \| 'brand' \| 'success' \| 'warning' \| 'danger'         | `neutral` | Semantic variant of the button                  |
| `appearance`     | string  | 'accent' \| 'filled-outlined' \| 'filled' \| 'outlined' \| 'plain' | `filled`  | Visual appearance style                         |
| `size`           | string  | 'small' \| 'medium' \| 'large'                                     | `medium`  | Button size                                     |
| `pill`           | boolean | -                                                                  | `false`   | Gives the button rounded edges                  |
| `disabled`       | boolean | -                                                                  | `false`   | Disables the button                             |
| `loading`        | boolean | -                                                                  | `false`   | Shows a loading indicator                       |
| `with-caret`     | boolean | -                                                                  | `false`   | Adds a dropdown indicator caret                 |
| `href`           | string  | -                                                                  | `-`       | Makes the button work like a link               |
| `target`         | string  | '\_blank' \| '\_self' \| '\_parent' \| '\_top'                     | `-`       | Link target (when href is set)                  |
| `download`       | string  | -                                                                  | `-`       | Download filename (when href is set)            |
| `rel`            | string  | -                                                                  | `-`       | Link relationship (when href is set)            |
| `type`           | string  | 'button' \| 'submit' \| 'reset'                                    | `button`  | The button's type for form submission           |
| `name`           | string  | -                                                                  | `-`       | The name of the button for form submission      |
| `value`          | string  | -                                                                  | `-`       | The value of the button for form submission     |
| `formaction`     | string  | -                                                                  | `-`       | Override the form's action attribute            |
| `formenctype`    | string  | -                                                                  | `-`       | Override the form's enctype attribute           |
| `formmethod`     | string  | -                                                                  | `-`       | Override the form's method attribute            |
| `formnovalidate` | boolean | -                                                                  | `false`   | Bypass form validation when this button submits |
| `formtarget`     | string  | -                                                                  | `-`       | Override the form's target attribute            |

## Slots

| Slot        | Description                                               |
| ----------- | --------------------------------------------------------- |
| _(default)_ | The button's label.                                       |
| `start`     | An element, such as `<wa-icon>`, placed before the label. |
| `end`       | An element, such as `<wa-icon>`, placed after the label.  |

## Events

| Event        | React Handler | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `blur`       | `onBlur`      | `FocusEvent`  | Emitted when the button loses focus.                                                              |
| `focus`      | `onFocus`     | `FocusEvent`  | Emitted when the button gains focus.                                                              |
| `wa-invalid` | `onWaInvalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part      | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `base`    | The component's base wrapper.                                   |
| `start`   | The container that wraps the `start` slot.                      |
| `label`   | The button's label.                                             |
| `end`     | The container that wraps the `end` slot.                        |
| `caret`   | The button's caret icon, a `<wa-icon>` element.                 |
| `spinner` | The spinner that shows when the button is in the loading state. |

## Methods

| Method    | Parameters              | Description                      |
| --------- | ----------------------- | -------------------------------- |
| `click()` | -                       | Simulates a click on the button. |
| `focus()` | `options: FocusOptions` | Sets focus on the button.        |
| `blur()`  | -                       | Removes focus from the button.   |

## Installation

```bash
npx kigumi add button
```

---

**Documentation**: [webawesome.com/docs/components/button](https://webawesome.com/docs/components/button)
