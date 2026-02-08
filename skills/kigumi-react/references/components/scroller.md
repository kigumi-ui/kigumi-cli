# Scroller

**Web Awesome**: `wa-scroller`  
**Kigumi React**: `<Scroller>`  
**Category**: Layout  
**Tier**: free

React wrapper component for the Web Awesome `wa-scroller` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-scroller orientation="horizontal" with-scroll-indicator
  >Click me</wa-scroller
>
```

```tsx
// Kigumi React
import { Scroller } from '@/components/ui';

<Scroller orientation="horizontal" with-scroll-indicator={true}>
  Click me
</Scroller>;
```

## Props

| Prop                    | Type    | Values                               | Default | Description             |
| ----------------------- | ------- | ------------------------------------ | ------- | ----------------------- |
| `orientation`           | string  | 'horizontal' \| 'vertical' \| 'both' | `both`  | Scroll direction        |
| `with-scroll-indicator` | boolean | -                                    | `false` | Shows shadow indicators |

## Installation

```bash
npx kigumi add scroller
```

---

**Documentation**: [webawesome.com/docs/components/scroller](https://webawesome.com/docs/components/scroller)
