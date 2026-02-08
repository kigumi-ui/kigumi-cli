# Details

**Web Awesome**: `wa-details`  
**Kigumi React**: `<Details>`  
**Category**: Organization  
**Tier**: free

React wrapper component for the Web Awesome `wa-details` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-details open summary="value">Click me</wa-details>
```

```tsx
// Kigumi React
import { Details } from '@/components/ui';

<Details open={true} summary="value">
  Click me
</Details>;
```

## Props

| Prop             | Type    | Values                                                 | Default    | Description                      |
| ---------------- | ------- | ------------------------------------------------------ | ---------- | -------------------------------- |
| `open`           | boolean | -                                                      | `false`    | Whether the details are expanded |
| `summary`        | string  | -                                                      | `-`        | Summary text shown in header     |
| `disabled`       | boolean | -                                                      | `false`    | Disables the details             |
| `appearance`     | string  | 'filled' \| 'outlined' \| 'filled-outlined' \| 'plain' | `outlined` | Visual appearance style          |
| `icon-placement` | string  | 'start' \| 'end'                                       | `end`      | Position of the expand icon      |
| `name`           | string  | -                                                      | `-`        | Name for accordion grouping      |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add details
```

---

**Documentation**: [webawesome.com/docs/components/details](https://webawesome.com/docs/components/details)
