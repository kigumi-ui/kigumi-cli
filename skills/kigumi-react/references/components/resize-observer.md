# ResizeObserver

**Web Awesome**: `wa-resize-observer`  
**Kigumi React**: `<ResizeObserver>`  
**Category**: Utilities  
**Tier**: free

React wrapper component for the Web Awesome `wa-resize-observer` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-resize-observer disabled>Click me</wa-resize-observer>
```

```tsx
// Kigumi React
import { ResizeObserver } from "@/components/ui";

<ResizeObserver disabled={true}>Click me</ResizeObserver>;
```

## Props

| Prop       | Type    | Values | Default | Description           |
| ---------- | ------- | ------ | ------- | --------------------- |
| `disabled` | boolean | -      | `false` | Disables the observer |

## Installation

```bash
npx kigumi add resize-observer
```

---

**Documentation**: [webawesome.com/docs/components/resize-observer](https://webawesome.com/docs/components/resize-observer)
