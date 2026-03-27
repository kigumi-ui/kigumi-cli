# Textarea

**Web Awesome**: `wa-textarea`  
**Kigumi Vue**: `<Textarea>`  
**Category**: Form Controls  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-textarea` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-textarea name="value" value="''">Click me</wa-textarea>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Textarea } from '@/components/ui';
</script>

<template>
  <Textarea name="value" value="''"> Click me </Textarea>
</template>
```

## Props

| Prop          | Type    | Values                                                   | Default    | Description           |
| ------------- | ------- | -------------------------------------------------------- | ---------- | --------------------- |
| `name`        | string  | -                                                        | `-`        | Form field name       |
| `value`       | string  | -                                                        | `''`       | Current value         |
| `appearance`  | string  | 'filled' \| 'outlined' \| 'filled-outlined'              | `outlined` | Visual appearance     |
| `size`        | string  | 'small' \| 'medium' \| 'large'                           | `medium`   | Textarea size         |
| `label`       | string  | -                                                        | `''`       | Label text            |
| `hint`        | string  | -                                                        | `''`       | Hint text             |
| `placeholder` | string  | -                                                        | `''`       | Placeholder text      |
| `rows`        | number  | -                                                        | `4`        | Visible rows          |
| `resize`      | string  | 'none' \| 'vertical' \| 'horizontal' \| 'both' \| 'auto' | `vertical` | Resize behavior       |
| `disabled`    | boolean | -                                                        | `false`    | Disables the textarea |
| `readonly`    | boolean | -                                                        | `false`    | Makes it readonly     |
| `required`    | boolean | -                                                        | `false`    | Makes it required     |
| `minlength`   | number  | -                                                        | `-`        | Minimum length        |
| `maxlength`   | number  | -                                                        | `-`        | Maximum length        |
| `spellcheck`  | boolean | -                                                        | `true`     | Enable spell checking |

## Slots

| Slot    | Description                                                                                |
| ------- | ------------------------------------------------------------------------------------------ |
| `label` | The textarea's label. Alternatively, you can use the `label` attribute.                    |
| `hint`  | Text that describes how to use the input. Alternatively, you can use the `hint` attribute. |

## Events

| Event        | Vue Handler   | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `blur`       | `@blur`       | `FocusEvent`  | Emitted when the control loses focus.                                                             |
| `change`     | `@change`     | `Event`       | Emitted when an alteration to the control's value is committed by the user.                       |
| `focus`      | `@focus`      | `FocusEvent`  | Emitted when the control gains focus.                                                             |
| `input`      | `@input`      | `InputEvent`  | Emitted when the control receives input.                                                          |
| `wa-invalid` | `@wa-invalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part                 | Description                                  |
| -------------------- | -------------------------------------------- |
| `label`              | The label                                    |
| `form-control-input` | The input's wrapper.                         |
| `hint`               | The hint's wrapper.                          |
| `textarea`           | The internal `<textarea>` control.           |
| `base`               | The wrapper around the `<textarea>` control. |

## Methods

| Method                | Parameters                                                                                                      | Description                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `focus()`             | `options: FocusOptions`                                                                                         | Sets focus on the textarea.                                       |
| `blur()`              | -                                                                                                               | Removes focus from the textarea.                                  |
| `select()`            | -                                                                                                               | Selects all the text in the textarea.                             |
| `scrollPosition()`    | `position: { top?: number; left?: number }`                                                                     | Gets or sets the textarea's scroll position.                      |
| `setSelectionRange()` | `selectionStart: number`, `selectionEnd: number`, `selectionDirection: 'forward' \| 'backward' \| 'none'`       | Sets the start and end positions of the text selection (0-based). |
| `setRangeText()`      | `replacement: string`, `start: number`, `end: number`, `selectMode: 'select' \| 'start' \| 'end' \| 'preserve'` | Replaces a range of text with a new string.                       |

## Installation

```bash
npx kigumi add textarea
```

---

**Documentation**: [webawesome.com/docs/components/textarea](https://webawesome.com/docs/components/textarea)
