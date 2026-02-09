# AnimatedImage

**Web Awesome**: `wa-animated-image`  
**Kigumi React**: `<AnimatedImage>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-animated-image` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-animated-image src="value" alt="value">Click me</wa-animated-image>
```

```tsx
// Kigumi React
import { AnimatedImage } from "@/components/ui";

<AnimatedImage src="value" alt="value">
  Click me
</AnimatedImage>;
```

## Props

| Prop   | Type    | Values | Default | Description                                                                   |
| ------ | ------- | ------ | ------- | ----------------------------------------------------------------------------- |
| `src`  | string  | -      | `-`     | The path to the image to load                                                 |
| `alt`  | string  | -      | `-`     | A description of the image used by assistive devices                          |
| `play` | boolean | -      | `false` | Plays the animation. When this attribute is removed, the animation will pause |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add animated-image
```

---

**Documentation**: [webawesome.com/docs/components/animated-image](https://webawesome.com/docs/components/animated-image)
