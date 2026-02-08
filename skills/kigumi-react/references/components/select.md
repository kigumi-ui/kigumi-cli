# Select

**Web Awesome**: `wa-select`  
**Kigumi React**: `<Select>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-select` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-select name="''" value="value">Click me</wa-select>
```

```tsx
// Kigumi React
import { Select } from '@/components/ui';

<Select name="''" value="value">
  Click me
</Select>;
```

## Props

| Prop                  | Type    | Values                                      | Default    | Description                 |
| --------------------- | ------- | ------------------------------------------- | ---------- | --------------------------- |
| `name`                | string  | -                                           | `''`       | Form field name             |
| `value`               | string  | -                                           | `-`        | Selected value(s)           |
| `appearance`          | string  | 'filled' \| 'outlined' \| 'filled-outlined' | `outlined` | Visual appearance           |
| `size`                | string  | 'small' \| 'medium' \| 'large'              | `medium`   | Select size                 |
| `placeholder`         | string  | -                                           | `''`       | Placeholder text            |
| `multiple`            | boolean | -                                           | `false`    | Allows multiple selections  |
| `max-options-visible` | number  | -                                           | `3`        | Max visible tags (multiple) |
| `disabled`            | boolean | -                                           | `false`    | Disables the select         |
| `with-clear`          | boolean | -                                           | `false`    | Shows clear button          |
| `open`                | boolean | -                                           | `false`    | Whether listbox is open     |
| `hoist`               | boolean | -                                           | `false`    | Hoists to body              |
| `placement`           | string  | 'top' \| 'bottom'                           | `bottom`   | Listbox placement           |
| `pill`                | boolean | -                                           | `false`    | Rounded edges               |
| `label`               | string  | -                                           | `''`       | Label text                  |
| `hint`                | string  | -                                           | `''`       | Hint text                   |
| `required`            | boolean | -                                           | `false`    | Makes selection required    |

## Dependencies

This component requires:

- [`Icon`](icon.md)
- [`Option`](option.md)
- [`Popup`](popup.md)
- [`Tag`](tag.md)

## Installation

```bash
npx kigumi add select
```

---

**Documentation**: [webawesome.com/docs/components/select](https://webawesome.com/docs/components/select)
