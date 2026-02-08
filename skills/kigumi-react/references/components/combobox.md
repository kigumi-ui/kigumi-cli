# Combobox

**Web Awesome**: `wa-combobox`  
**Kigumi React**: `<Combobox>`  
**Category**: Form Controls  
**Tier**: pro

React wrapper component for the Web Awesome `wa-combobox` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-combobox allow-custom-value appearance="filled">Click me</wa-combobox>
```

```tsx
// Kigumi React
import { Combobox } from '@/components/ui';

<Combobox allow-custom-value={true} appearance="filled">
  Click me
</Combobox>;
```

## Props

| Prop                  | Type    | Values                                      | Default    | Description                              |
| --------------------- | ------- | ------------------------------------------- | ---------- | ---------------------------------------- |
| `allow-custom-value`  | boolean | -                                           | `false`    | Allows entering custom values            |
| `appearance`          | string  | 'filled' \| 'outlined' \| 'filled-outlined' | `outlined` | Visual appearance style                  |
| `autocomplete`        | string  | 'list' \| 'none'                            | `list`     | Autocomplete behavior                    |
| `disabled`            | boolean | -                                           | `false`    | Disables the combobox                    |
| `hint`                | string  | -                                           | `''`       | Hint text                                |
| `label`               | string  | -                                           | `''`       | Label text                               |
| `max-options-visible` | number  | -                                           | `3`        | Maximum visible options before scrolling |
| `multiple`            | boolean | -                                           | `false`    | Allows multiple selections               |
| `name`                | string  | -                                           | `''`       | Form field name                          |
| `open`                | boolean | -                                           | `false`    | Whether the listbox is open              |
| `pill`                | boolean | -                                           | `false`    | Rounded edges style                      |
| `placeholder`         | string  | -                                           | `''`       | Placeholder text                         |
| `placement`           | string  | 'top' \| 'bottom'                           | `bottom`   | Listbox placement                        |
| `required`            | boolean | -                                           | `false`    | Makes field mandatory                    |
| `size`                | string  | 'small' \| 'medium' \| 'large'              | `medium`   | Combobox size                            |
| `with-clear`          | boolean | -                                           | `false`    | Shows clear button                       |

## Dependencies

This component requires:

- [`Button`](button.md)
- [`Icon`](icon.md)
- [`Option`](option.md)
- [`Popup`](popup.md)
- [`Tag`](tag.md)

## Installation

```bash
npx kigumi add combobox
```

---

**Documentation**: [webawesome.com/docs/components/combobox](https://webawesome.com/docs/components/combobox)
