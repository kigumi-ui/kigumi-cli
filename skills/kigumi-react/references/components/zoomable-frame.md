# ZoomableFrame

**Web Awesome**: `wa-zoomable-frame`  
**Kigumi React**: `<ZoomableFrame>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-zoomable-frame` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-zoomable-frame src="value" srcdoc="value">Click me</wa-zoomable-frame>
```

```tsx
// Kigumi React
import { ZoomableFrame } from "@/components/ui";

<ZoomableFrame src="value" srcdoc="value">
  Click me
</ZoomableFrame>;
```

## Props

| Prop                  | Type    | Values            | Default                                | Description               |
| --------------------- | ------- | ----------------- | -------------------------------------- | ------------------------- |
| `src`                 | string  | -                 | `-`                                    | URL of content to display |
| `srcdoc`              | string  | -                 | `-`                                    | Inline HTML to render     |
| `zoom`                | number  | -                 | `1`                                    | Current zoom level        |
| `zoom-levels`         | string  | -                 | `25% 50% 75% 100% 125% 150% 175% 200%` | Available zoom levels     |
| `allowfullscreen`     | boolean | -                 | `false`                                | Enables fullscreen        |
| `loading`             | string  | 'eager' \| 'lazy' | `eager`                                | Loading behavior          |
| `without-controls`    | boolean | -                 | `false`                                | Hides zoom controls       |
| `without-interaction` | boolean | -                 | `false`                                | Disables interaction      |
| `sandbox`             | string  | -                 | `-`                                    | Security restrictions     |
| `referrerpolicy`      | string  | -                 | `-`                                    | Referrer policy           |

## Dependencies

This component requires:

- [`ButtonGroup`](button-group.md)
- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add zoomable-frame
```

---

**Documentation**: [webawesome.com/docs/components/zoomable-frame](https://webawesome.com/docs/components/zoomable-frame)
