# Textarea

**Web Awesome**: `wa-textarea`  
**Kigumi React**: `<Textarea>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-textarea` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-textarea name="value" value="''">Click me</wa-textarea>
```

```tsx
// Kigumi React
import { Textarea } from '@/components/ui';

<Textarea name="value" value="''">
  Click me
</Textarea>;
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

## Installation

```bash
npx kigumi add textarea
```

---

**Documentation**: [webawesome.com/docs/components/textarea](https://webawesome.com/docs/components/textarea)
