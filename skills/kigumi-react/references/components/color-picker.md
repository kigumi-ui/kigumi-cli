# ColorPicker

**Web Awesome**: `wa-color-picker`  
**Kigumi React**: `<ColorPicker>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-color-picker` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-color-picker value="value" format="hex">Click me</wa-color-picker>
```

```tsx
// Kigumi React
import { ColorPicker } from '@/components/ui';

<ColorPicker value="value" format="hex">
  Click me
</ColorPicker>;
```

## Props

| Prop                    | Type    | Values                           | Default  | Description                      |
| ----------------------- | ------- | -------------------------------- | -------- | -------------------------------- |
| `value`                 | string  | -                                | `-`      | The current color value          |
| `format`                | string  | 'hex' \| 'rgb' \| 'hsl' \| 'hsv' | `hex`    | Color format                     |
| `opacity`               | boolean | -                                | `false`  | Enables opacity slider           |
| `disabled`              | boolean | -                                | `false`  | Disables the color picker        |
| `required`              | boolean | -                                | `false`  | Makes field mandatory            |
| `size`                  | string  | 'small' \| 'medium' \| 'large'   | `medium` | Color picker size                |
| `label`                 | string  | -                                | `''`     | Label text                       |
| `hint`                  | string  | -                                | `''`     | Hint text                        |
| `name`                  | string  | -                                | `-`      | Form field name                  |
| `open`                  | boolean | -                                | `false`  | Whether the panel is open        |
| `swatches`              | string  | -                                | `''`     | Predefined color swatches        |
| `uppercase`             | boolean | -                                | `false`  | Displays hex values in uppercase |
| `without-format-toggle` | boolean | -                                | `false`  | Hides the format toggle button   |

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
