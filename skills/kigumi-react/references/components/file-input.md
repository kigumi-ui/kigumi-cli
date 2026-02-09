# FileInput

**Web Awesome**: `wa-file-input`  
**Kigumi React**: `<FileInput>`  
**Category**: Form Controls  
**Tier**: pro

React wrapper component for the Web Awesome `wa-file-input` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-file-input label="value" hint="value">Click me</wa-file-input>
```

```tsx
// Kigumi React
import { FileInput } from "@/components/ui";

<FileInput label="value" hint="value">
  Click me
</FileInput>;
```

## Props

| Prop            | Type    | Values                                      | Default    | Description                                    |
| --------------- | ------- | ------------------------------------------- | ---------- | ---------------------------------------------- |
| `label`         | string  | -                                           | `-`        | Accessible label for the input                 |
| `hint`          | string  | -                                           | `-`        | Descriptive hint text                          |
| `accept`        | string  | -                                           | `-`        | Accepted file types (MIME types or extensions) |
| `multiple`      | boolean | -                                           | `false`    | Allow multiple file selection                  |
| `disabled`      | boolean | -                                           | `false`    | Disables the input                             |
| `required`      | boolean | -                                           | `false`    | Makes field mandatory                          |
| `size`          | string  | 'small' \| 'medium' \| 'large'              | `medium`   | Input size                                     |
| `appearance`    | string  | 'filled' \| 'outlined' \| 'filled-outlined' | `outlined` | Visual appearance                              |
| `max-file-size` | number  | -                                           | `-`        | Maximum file size in bytes                     |
| `max-files`     | number  | -                                           | `-`        | Maximum number of files                        |

## Installation

```bash
npx kigumi add file-input
```

---

**Documentation**: [webawesome.com/docs/components/file-input](https://webawesome.com/docs/components/file-input)
