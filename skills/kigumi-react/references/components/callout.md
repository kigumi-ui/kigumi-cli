# Callout

**Web Awesome**: `wa-callout`  
**Kigumi React**: `<Callout>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-callout` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-callout appearance="accent" size="small">Click me</wa-callout>
```

```tsx
// Kigumi React
import { Callout } from "@/components/ui";

<Callout appearance="accent" size="small">
  Click me
</Callout>;
```

## Props

| Prop         | Type   | Values                                                             | Default           | Description                     |
| ------------ | ------ | ------------------------------------------------------------------ | ----------------- | ------------------------------- |
| `appearance` | string | 'accent' \| 'filled' \| 'outlined' \| 'plain' \| 'filled-outlined' | `filled-outlined` | The callout's visual appearance |
| `size`       | string | 'small' \| 'medium' \| 'large'                                     | `medium`          | The callout's size              |
| `variant`    | string | 'brand' \| 'neutral' \| 'success' \| 'warning' \| 'danger'         | `brand`           | The callout's theme variant     |

## Installation

```bash
npx kigumi add callout
```

---

**Documentation**: [webawesome.com/docs/components/callout](https://webawesome.com/docs/components/callout)
