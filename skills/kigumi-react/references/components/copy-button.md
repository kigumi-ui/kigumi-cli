# CopyButton

**Web Awesome**: `wa-copy-button`  
**Kigumi React**: `<CopyButton>`  
**Category**: Actions  
**Tier**: free

React wrapper component for the Web Awesome `wa-copy-button` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-copy-button value="''" from="''">Click me</wa-copy-button>
```

```tsx
// Kigumi React
import { CopyButton } from '@/components/ui';

<CopyButton value="''" from="''">
  Click me
</CopyButton>;
```

## Props

| Prop                | Type    | Values                                 | Default | Description                                |
| ------------------- | ------- | -------------------------------------- | ------- | ------------------------------------------ |
| `value`             | string  | -                                      | `''`    | The text to copy                           |
| `from`              | string  | -                                      | `''`    | Element selector to copy text from         |
| `disabled`          | boolean | -                                      | `false` | Disables the button                        |
| `copy-label`        | string  | -                                      | `''`    | Tooltip label for copy state               |
| `success-label`     | string  | -                                      | `''`    | Tooltip label for success state            |
| `error-label`       | string  | -                                      | `''`    | Tooltip label for error state              |
| `feedback-duration` | number  | -                                      | `1000`  | Duration of feedback state in milliseconds |
| `tooltip-placement` | string  | 'top' \| 'right' \| 'bottom' \| 'left' | `top`   | Tooltip position                           |

## Dependencies

This component requires:

- [`Icon`](icon.md)
- [`Tooltip`](tooltip.md)

## Installation

```bash
npx kigumi add copy-button
```

---

**Documentation**: [webawesome.com/docs/components/copy-button](https://webawesome.com/docs/components/copy-button)
