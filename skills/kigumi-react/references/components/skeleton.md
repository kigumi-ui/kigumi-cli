# Skeleton

**Web Awesome**: `wa-skeleton`  
**Kigumi React**: `<Skeleton>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-skeleton` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-skeleton effect="pulse">Click me</wa-skeleton>
```

```tsx
// Kigumi React
import { Skeleton } from "@/components/ui";

<Skeleton effect="pulse">Click me</Skeleton>;
```

## Props

| Prop     | Type   | Values                       | Default | Description      |
| -------- | ------ | ---------------------------- | ------- | ---------------- |
| `effect` | string | 'pulse' \| 'sheen' \| 'none' | `none`  | Animation effect |

## Installation

```bash
npx kigumi add skeleton
```

---

**Documentation**: [webawesome.com/docs/components/skeleton](https://webawesome.com/docs/components/skeleton)
