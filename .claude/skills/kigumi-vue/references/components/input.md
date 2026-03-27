# Input

**Web Awesome**: `wa-input`  
**Kigumi Vue**: `<Input>`  
**Category**: Form Controls  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-input` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-input type="text" label="value">Click me</wa-input>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Input } from '@/components/ui';
</script>

<template>
  <Input type="text" label="value"> Click me </Input>
</template>
```

## Props

| Prop                   | Type    | Values                                                                              | Default    | Description                                       |
| ---------------------- | ------- | ----------------------------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| `type`                 | string  | 'text' \| 'email' \| 'password' \| 'number' \| 'date' \| 'tel' \| 'url' \| 'search' | `text`     | Input type                                        |
| `label`                | string  | -                                                                                   | `-`        | Accessible label for the input                    |
| `hint`                 | string  | -                                                                                   | `-`        | Descriptive hint text                             |
| `placeholder`          | string  | -                                                                                   | `-`        | Placeholder text                                  |
| `value`                | string  | -                                                                                   | `-`        | Input value                                       |
| `appearance`           | string  | 'filled' \| 'filled-outlined' \| 'outlined'                                         | `outlined` | Visual appearance style                           |
| `size`                 | string  | 'small' \| 'medium' \| 'large'                                                      | `medium`   | Input size                                        |
| `pill`                 | boolean | -                                                                                   | `false`    | Gives the input rounded edges                     |
| `disabled`             | boolean | -                                                                                   | `false`    | Disables the input                                |
| `with-clear`           | boolean | -                                                                                   | `false`    | Adds a clear button when input has content        |
| `password-toggle`      | boolean | -                                                                                   | `false`    | Adds a toggle button for password visibility      |
| `password-visible`     | boolean | -                                                                                   | `false`    | Shows the password as plain text when set         |
| `readonly`             | boolean | -                                                                                   | `false`    | Makes the input readonly                          |
| `required`             | boolean | -                                                                                   | `false`    | Makes the input required                          |
| `name`                 | string  | -                                                                                   | `-`        | The name of the input for form submission         |
| `pattern`              | string  | -                                                                                   | `-`        | A regular expression pattern the value must match |
| `minlength`            | number  | -                                                                                   | `-`        | Minimum string length                             |
| `maxlength`            | number  | -                                                                                   | `-`        | Maximum string length                             |
| `min`                  | string  | -                                                                                   | `-`        | Minimum value for numeric and date types          |
| `max`                  | string  | -                                                                                   | `-`        | Maximum value for numeric and date types          |
| `step`                 | string  | -                                                                                   | `-`        | Step increment for numeric types                  |
| `without-spin-buttons` | boolean | -                                                                                   | `false`    | Hides the browser's built-in spin buttons         |
| `autocomplete`         | string  | -                                                                                   | `-`        | Hint for autocomplete behavior                    |
| `autocapitalize`       | string  | 'off' \| 'none' \| 'on' \| 'sentences' \| 'words' \| 'characters'                   | `-`        | Controls automatic capitalization                 |
| `autocorrect`          | boolean | -                                                                                   | `false`    | Enable autocorrect                                |
| `autofocus`            | boolean | -                                                                                   | `false`    | Automatically focuses the input on page load      |
| `inputmode`            | string  | 'none' \| 'text' \| 'decimal' \| 'numeric' \| 'tel' \| 'search' \| 'email' \| 'url' | `-`        | Hint for virtual keyboard type                    |
| `enterkeyhint`         | string  | 'enter' \| 'done' \| 'go' \| 'next' \| 'previous' \| 'search' \| 'send'             | `-`        | Hint for Enter key label on virtual keyboards     |

## Slots

| Slot                 | Description                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `label`              | The input's label. Alternatively, you can use the `label` attribute.                       |
| `start`              | An element, such as `<wa-icon>`, placed at the start of the input control.                 |
| `end`                | An element, such as `<wa-icon>`, placed at the end of the input control.                   |
| `clear-icon`         | An icon to use in lieu of the default clear icon.                                          |
| `show-password-icon` | An icon to use in lieu of the default show password icon.                                  |
| `hide-password-icon` | An icon to use in lieu of the default hide password icon.                                  |
| `hint`               | Text that describes how to use the input. Alternatively, you can use the `hint` attribute. |

## Events

| Event        | Vue Handler   | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `input`      | `@input`      | `InputEvent`  | Emitted when the control receives input.                                                          |
| `change`     | `@change`     | `Event`       | Emitted when an alteration to the control's value is committed by the user.                       |
| `blur`       | `@blur`       | `FocusEvent`  | Emitted when the control loses focus.                                                             |
| `focus`      | `@focus`      | `FocusEvent`  | Emitted when the control gains focus.                                                             |
| `wa-clear`   | `@wa-clear`   | `CustomEvent` | Emitted when the clear button is activated.                                                       |
| `wa-invalid` | `@wa-invalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part                     | Description                                |
| ------------------------ | ------------------------------------------ |
| `label`                  | The label                                  |
| `hint`                   | The hint's wrapper.                        |
| `base`                   | The wrapper being rendered as an input     |
| `input`                  | The internal `<input>` control.            |
| `start`                  | The container that wraps the `start` slot. |
| `clear-button`           | The clear button.                          |
| `password-toggle-button` | The password toggle button.                |
| `end`                    | The container that wraps the `end` slot.   |

## Methods

| Method                | Parameters                                                                                                      | Description                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `focus()`             | `options: FocusOptions`                                                                                         | Sets focus on the input.                                                                                     |
| `blur()`              | -                                                                                                               | Removes focus from the input.                                                                                |
| `select()`            | -                                                                                                               | Selects all the text in the input.                                                                           |
| `setSelectionRange()` | `selectionStart: number`, `selectionEnd: number`, `selectionDirection: 'forward' \| 'backward' \| 'none'`       | Sets the start and end positions of the text selection (0-based).                                            |
| `setRangeText()`      | `replacement: string`, `start: number`, `end: number`, `selectMode: 'select' \| 'start' \| 'end' \| 'preserve'` | Replaces a range of text with a new string.                                                                  |
| `showPicker()`        | -                                                                                                               | Displays the browser picker for an input element (only works if the browser supports it for the input type). |
| `stepUp()`            | -                                                                                                               | Increments the value of a numeric input type by the value of the step attribute.                             |
| `stepDown()`          | -                                                                                                               | Decrements the value of a numeric input type by the value of the step attribute.                             |

## Installation

```bash
npx kigumi add input
```

---

**Documentation**: [webawesome.com/docs/components/input](https://webawesome.com/docs/components/input)
