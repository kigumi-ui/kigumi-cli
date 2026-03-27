# Spinner

**Web Awesome**: `wa-spinner`  
**Kigumi React**: `<Spinner>`  
**Category**: Progress  
**Tier**: free

React wrapper component for the Web Awesome `wa-spinner` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-spinner>Click me</wa-spinner>
```

```tsx
// Kigumi React
import { Spinner } from '@/components/ui';

<Spinner>Click me</Spinner>;
```

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## CSS Custom Properties

| Property            | Default | Description                                                        |
| ------------------- | ------- | ------------------------------------------------------------------ |
| `--track-width`     | -       | The width of the track.                                            |
| `--track-color`     | -       | The color of the track.                                            |
| `--indicator-color` | -       | The color of the spinner's indicator.                              |
| `--speed`           | -       | The time it takes for the spinner to complete one animation cycle. |

## Installation

```bash
npx kigumi add spinner
```

---

**Documentation**: [webawesome.com/docs/components/spinner](https://webawesome.com/docs/components/spinner)
