# IntersectionObserver

**Web Awesome**: `wa-intersection-observer`  
**Kigumi React**: `<IntersectionObserver>`  
**Category**: Utilities  
**Tier**: free

React wrapper component for the Web Awesome `wa-intersection-observer` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-intersection-observer disabled once>Click me</wa-intersection-observer>
```

```tsx
// Kigumi React
import { IntersectionObserver } from "@/components/ui";

<IntersectionObserver disabled={true} once={true}>
  Click me
</IntersectionObserver>;
```

## Props

| Prop          | Type    | Values | Default | Description                              |
| ------------- | ------- | ------ | ------- | ---------------------------------------- |
| `disabled`    | boolean | -      | `false` | Disables the observer                    |
| `once`        | boolean | -      | `false` | Stops observing after first intersection |
| `threshold`   | string  | -      | `0`     | Intersection thresholds                  |
| `root-margin` | string  | -      | `0px`   | Root element margin                      |

## Installation

```bash
npx kigumi add intersection-observer
```

---

**Documentation**: [webawesome.com/docs/components/intersection-observer](https://webawesome.com/docs/components/intersection-observer)
