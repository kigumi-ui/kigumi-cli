# ProgressRing

**Web Awesome**: `wa-progress-ring`  
**Kigumi React**: `<ProgressRing>`  
**Category**: Progress  
**Tier**: free

React wrapper component for the Web Awesome `wa-progress-ring` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-progress-ring value="0" label="''">Click me</wa-progress-ring>
```

```tsx
// Kigumi React
import { ProgressRing } from '@/components/ui';

<ProgressRing value="0" label="''">
  Click me
</ProgressRing>;
```

## Props

| Prop    | Type   | Values | Default | Description              |
| ------- | ------ | ------ | ------- | ------------------------ |
| `value` | number | -      | `0`     | Current progress (0-100) |
| `label` | string | -      | `''`    | Accessible label         |

## Slots

| Slot        | Description                      |
| ----------- | -------------------------------- |
| _(default)_ | A label to show inside the ring. |

## CSS Parts

| Part        | Description                    |
| ----------- | ------------------------------ |
| `base`      | The component's base wrapper.  |
| `label`     | The progress ring label.       |
| `track`     | The progress ring's track.     |
| `indicator` | The progress ring's indicator. |

## CSS Custom Properties

| Property                          | Default | Description                                                        |
| --------------------------------- | ------- | ------------------------------------------------------------------ |
| `--size`                          | -       | The diameter of the progress ring (cannot be a percentage).        |
| `--track-width`                   | -       | The width of the track.                                            |
| `--track-color`                   | -       | The color of the track.                                            |
| `--indicator-width`               | -       | The width of the indicator. Defaults to the track width.           |
| `--indicator-color`               | -       | The color of the indicator.                                        |
| `--indicator-transition-duration` | -       | The duration of the indicator's transition when the value changes. |

## Installation

```bash
npx kigumi add progress-ring
```

---

**Documentation**: [webawesome.com/docs/components/progress-ring](https://webawesome.com/docs/components/progress-ring)
