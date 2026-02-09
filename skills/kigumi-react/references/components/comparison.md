# Comparison

**Web Awesome**: `wa-comparison`  
**Kigumi React**: `<Comparison>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-comparison` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-comparison position="50">Click me</wa-comparison>
```

```tsx
// Kigumi React
import { Comparison } from "@/components/ui";

<Comparison position="50">Click me</Comparison>;
```

## Props

| Prop       | Type   | Values | Default | Description                            |
| ---------- | ------ | ------ | ------- | -------------------------------------- |
| `position` | number | -      | `50`    | Divider location as percentage (0-100) |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add comparison
```

---

**Documentation**: [webawesome.com/docs/components/comparison](https://webawesome.com/docs/components/comparison)
