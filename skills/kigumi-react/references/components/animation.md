# Animation

**Web Awesome**: `wa-animation`  
**Kigumi React**: `<Animation>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-animation` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-animation name="none" play>Click me</wa-animation>
```

```tsx
// Kigumi React
import { Animation } from "@/components/ui";

<Animation name="none" play={true}>
  Click me
</Animation>;
```

## Props

| Prop              | Type    | Values                                                      | Default    | Description                                                      |
| ----------------- | ------- | ----------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `name`            | string  | -                                                           | `none`     | The name of the built-in animation to use                        |
| `play`            | boolean | -                                                           | `false`    | Plays the animation. When omitted, the animation will be paused  |
| `delay`           | number  | -                                                           | `0`        | The number of milliseconds to delay the start of the animation   |
| `direction`       | string  | 'normal' \| 'reverse' \| 'alternate' \| 'alternate-reverse' | `normal`   | Determines the direction of playback                             |
| `duration`        | number  | -                                                           | `1000`     | The number of milliseconds each iteration takes to complete      |
| `easing`          | string  | -                                                           | `linear`   | The easing function to use                                       |
| `end-delay`       | number  | -                                                           | `0`        | The number of milliseconds to delay after the active period      |
| `fill`            | string  | 'auto' \| 'backwards' \| 'both' \| 'forwards' \| 'none'     | `auto`     | Sets how the animation applies styles before and after execution |
| `iterations`      | number  | -                                                           | `Infinity` | The number of iterations to run before completing                |
| `iteration-start` | number  | -                                                           | `0`        | The offset at which to start the animation                       |
| `playback-rate`   | number  | -                                                           | `1`        | Sets the animation's playback rate                               |

## Installation

```bash
npx kigumi add animation
```

---

**Documentation**: [webawesome.com/docs/components/animation](https://webawesome.com/docs/components/animation)
