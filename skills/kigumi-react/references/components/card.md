# Card

**Web Awesome**: `wa-card`  
**Kigumi React**: `<Card>`  
**Category**: Organization  
**Tier**: free

React wrapper component for the Web Awesome `wa-card` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-card appearance="outlined" orientation="vertical">Click me</wa-card>
```

```tsx
// Kigumi React
import { Card } from "@/components/ui";

<Card appearance="outlined" orientation="vertical">
  Click me
</Card>;
```

## Props

| Prop          | Type    | Values                                                             | Default    | Description                   |
| ------------- | ------- | ------------------------------------------------------------------ | ---------- | ----------------------------- |
| `appearance`  | string  | 'outlined' \| 'filled-outlined' \| 'plain' \| 'filled' \| 'accent' | `outlined` | Visual appearance style       |
| `orientation` | string  | 'vertical' \| 'horizontal'                                         | `vertical` | Card layout orientation       |
| `with-header` | boolean | -                                                                  | `false`    | Adds header section (for SSR) |
| `with-footer` | boolean | -                                                                  | `false`    | Adds footer section (for SSR) |
| `with-media`  | boolean | -                                                                  | `false`    | Adds media section (for SSR)  |

## Installation

```bash
npx kigumi add card
```

---

**Documentation**: [webawesome.com/docs/components/card](https://webawesome.com/docs/components/card)
