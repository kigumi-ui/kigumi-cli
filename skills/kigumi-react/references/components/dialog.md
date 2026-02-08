# Dialog

**Web Awesome**: `wa-dialog`  
**Kigumi React**: `<Dialog>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-dialog` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-dialog open label="''">Click me</wa-dialog>
```

```tsx
// Kigumi React
import { Dialog } from '@/components/ui';

<Dialog open={true} label="''">
  Click me
</Dialog>;
```

## Props

| Prop             | Type    | Values | Default | Description                                                                |
| ---------------- | ------- | ------ | ------- | -------------------------------------------------------------------------- |
| `open`           | boolean | -      | `false` | Indicates whether or not the dialog is open                                |
| `label`          | string  | -      | `''`    | The dialog's label as displayed in the header                              |
| `without-header` | boolean | -      | `false` | Disables the header and removes the default close button                   |
| `light-dismiss`  | boolean | -      | `false` | When enabled, the dialog will be closed when the user clicks outside of it |

## Installation

```bash
npx kigumi add dialog
```

---

**Documentation**: [webawesome.com/docs/components/dialog](https://webawesome.com/docs/components/dialog)
