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
import { Skeleton } from '@/components/ui';

<Skeleton effect="pulse">Click me</Skeleton>;
```

## Props

| Prop     | Type   | Values                       | Default | Description      |
| -------- | ------ | ---------------------------- | ------- | ---------------- |
| `effect` | string | 'pulse' \| 'sheen' \| 'none' | `none`  | Animation effect |

## CSS Parts

| Part        | Description                                                                |
| ----------- | -------------------------------------------------------------------------- |
| `indicator` | The skeleton's indicator which is responsible for its color and animation. |

## CSS Custom Properties

| Property        | Default | Description                                                |
| --------------- | ------- | ---------------------------------------------------------- |
| `--color`       | -       | The color of the skeleton.                                 |
| `--sheen-color` | -       | The sheen color when the skeleton is in its loading state. |

## Installation

```bash
npx kigumi add skeleton
```

---

**Documentation**: [webawesome.com/docs/components/skeleton](https://webawesome.com/docs/components/skeleton)
