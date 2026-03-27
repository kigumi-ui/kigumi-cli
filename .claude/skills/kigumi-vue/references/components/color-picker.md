# ColorPicker

**Web Awesome**: `wa-color-picker`  
**Kigumi Vue**: `<ColorPicker>`  
**Category**: Form Controls  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-color-picker` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-color-picker value="value" format="hex">Click me</wa-color-picker>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { ColorPicker } from '@/components/ui';
</script>

<template>
  <ColorPicker value="value" format="hex"> Click me </ColorPicker>
</template>
```

## Props

| Prop                    | Type    | Values                           | Default  | Description                                              |
| ----------------------- | ------- | -------------------------------- | -------- | -------------------------------------------------------- |
| `value`                 | string  | -                                | `-`      | The current color value                                  |
| `format`                | string  | 'hex' \| 'rgb' \| 'hsl' \| 'hsv' | `hex`    | Color format                                             |
| `opacity`               | boolean | -                                | `false`  | Enables opacity slider                                   |
| `disabled`              | boolean | -                                | `false`  | Disables the color picker                                |
| `required`              | boolean | -                                | `false`  | Makes field mandatory                                    |
| `size`                  | string  | 'small' \| 'medium' \| 'large'   | `medium` | Color picker size                                        |
| `label`                 | string  | -                                | `''`     | Label text                                               |
| `hint`                  | string  | -                                | `''`     | Hint text                                                |
| `name`                  | string  | -                                | `-`      | Form field name                                          |
| `open`                  | boolean | -                                | `false`  | Whether the panel is open                                |
| `swatches`              | string  | -                                | `''`     | Predefined color swatches                                |
| `uppercase`             | boolean | -                                | `false`  | Displays hex values in uppercase                         |
| `without-format-toggle` | boolean | -                                | `false`  | Hides the format toggle button                           |
| `inline`                | boolean | -                                | `false`  | Renders the color picker inline instead of in a dropdown |

## Slots

| Slot    | Description                                                                      |
| ------- | -------------------------------------------------------------------------------- |
| `label` | The color picker's form label. Alternatively, you can use the `label` attribute. |
| `hint`  | The color picker's form hint. Alternatively, you can use the `hint` attribute.   |

## Events

| Event           | Vue Handler      | Type          | Description                                                                                       |
| --------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `change`        | `@change`        | `Event`       | Emitted when the color picker's value changes.                                                    |
| `input`         | `@input`         | `InputEvent`  | Emitted when the color picker receives input.                                                     |
| `wa-show`       | `@wa-show`       | `CustomEvent` |                                                                                                   |
| `wa-after-show` | `@wa-after-show` | `CustomEvent` |                                                                                                   |
| `wa-hide`       | `@wa-hide`       | `CustomEvent` |                                                                                                   |
| `wa-after-hide` | `@wa-after-hide` | `CustomEvent` |                                                                                                   |
| `blur`          | `@blur`          | `FocusEvent`  | Emitted when the color picker loses focus.                                                        |
| `focus`         | `@focus`         | `FocusEvent`  | Emitted when the color picker receives focus.                                                     |
| `wa-invalid`    | `@wa-invalid`    | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part                       | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `base`                     | The component's base wrapper.                    |
| `trigger`                  | The color picker's dropdown trigger.             |
| `swatches`                 | The container that holds the swatches.           |
| `swatch`                   | Each individual swatch.                          |
| `grid`                     | The color grid.                                  |
| `grid-handle`              | The color grid's handle.                         |
| `slider`                   | Hue and opacity sliders.                         |
| `slider-handle`            | Hue and opacity slider handles.                  |
| `hue-slider`               | The hue slider.                                  |
| `hue-slider-handle`        | The hue slider's handle.                         |
| `opacity-slider`           | The opacity slider.                              |
| `opacity-slider-handle`    | The opacity slider's handle.                     |
| `preview`                  | The preview color.                               |
| `input`                    | The text input.                                  |
| `eyedropper-button`        | The eye dropper button.                          |
| `eyedropper-button__base`  | The eye dropper button's exported `button` part. |
| `eyedropper-button__start` | The eye dropper button's exported `start` part.  |
| `eyedropper-button__label` | The eye dropper button's exported `label` part.  |
| `eyedropper-button__end`   | The eye dropper button's exported `end` part.    |
| `eyedropper-button__caret` | The eye dropper button's exported `caret` part.  |
| `format-button`            | The format button.                               |
| `format-button__base`      | The format button's exported `button` part.      |
| `format-button__start`     | The format button's exported `start` part.       |
| `format-button__label`     | The format button's exported `label` part.       |
| `format-button__end`       | The format button's exported `end` part.         |
| `format-button__caret`     | The format button's exported `caret` part.       |

## CSS Custom Properties

| Property               | Default | Description                              |
| ---------------------- | ------- | ---------------------------------------- |
| `--grid-width`         | -       | The width of the color grid.             |
| `--grid-height`        | -       | The height of the color grid.            |
| `--grid-handle-size`   | -       | The size of the color grid's handle.     |
| `--slider-height`      | -       | The height of the hue and alpha sliders. |
| `--slider-handle-size` | -       | The diameter of the slider's handle.     |

## Methods

| Method                | Parameters                                                                         | Description                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `getHexString()`      | `hue: number`, `saturation: number`, `brightness: number`, `alpha: unknown`        | Generates a hex string from HSV values. Hue must be 0-360. All other arguments must be 0-100. |
| `focus()`             | `options: FocusOptions`                                                            | Sets focus on the color picker.                                                               |
| `blur()`              | -                                                                                  | Removes focus from the color picker.                                                          |
| `getFormattedValue()` | `format: 'hex' \| 'hexa' \| 'rgb' \| 'rgba' \| 'hsl' \| 'hsla' \| 'hsv' \| 'hsva'` | Returns the current value as a string in the specified format.                                |
| `show()`              | -                                                                                  | Shows the color picker panel.                                                                 |
| `hide()`              | -                                                                                  | Hides the color picker panel                                                                  |

## Dependencies

This component requires:

- [`Button`](button.md)
- [`Icon`](icon.md)
- [`Input`](input.md)
- [`Popup`](popup.md)

## Installation

```bash
npx kigumi add color-picker
```

---

**Documentation**: [webawesome.com/docs/components/color-picker](https://webawesome.com/docs/components/color-picker)
