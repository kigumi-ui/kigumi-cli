# Icon

**Web Awesome**: `wa-icon`  
**Kigumi React**: `<Icon>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-icon` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-icon name="value" library="default">Click me</wa-icon>
```

```tsx
// Kigumi React
import { Icon } from '@/components/ui';

<Icon name="value" library="default">
  Click me
</Icon>;
```

## Props

| Prop           | Type    | Values                               | Default   | Description                                                          |
| -------------- | ------- | ------------------------------------ | --------- | -------------------------------------------------------------------- |
| `name`         | string  | -                                    | `-`       | The name of the icon to draw                                         |
| `library`      | string  | -                                    | `default` | The name of a registered custom icon library                         |
| `src`          | string  | -                                    | `-`       | An external URL of an SVG file                                       |
| `label`        | string  | -                                    | `''`      | An alternate description for assistive devices                       |
| `family`       | string  | -                                    | `-`       | The family of icons (classic, brands, sharp, duotone, sharp-duotone) |
| `variant`      | string  | -                                    | `-`       | The icon's variant (thin, light, regular, solid)                     |
| `auto-width`   | boolean | -                                    | `false`   | Sets the width to match the cropped SVG viewBox                      |
| `swap-opacity` | boolean | -                                    | `false`   | Swaps the opacity of duotone icons                                   |
| `rotate`       | number  | -                                    | `-`       | Rotate the icon by this many degrees                                 |
| `flip`         | string  | 'horizontal' \| 'vertical' \| 'both' | `-`       | Flip the icon horizontally, vertically, or both                      |
| `animation`    | string  | -                                    | `-`       | The name of a built-in animation to apply                            |

## Events

| Event      | React Handler | Type          | Description                                                                                             |
| ---------- | ------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `wa-load`  | `onWaLoad`    | `CustomEvent` | Emitted when the icon has loaded. When using `spriteSheet: true` this will not emit.                    |
| `wa-error` | `onWaError`   | `CustomEvent` | Emitted when the icon fails to load due to an error. When using `spriteSheet: true` this will not emit. |

## CSS Parts

| Part  | Description                                                  |
| ----- | ------------------------------------------------------------ |
| `svg` | The internal SVG element.                                    |
| `use` | The `<use>` element generated when using `spriteSheet: true` |

## CSS Custom Properties

| Property                      | Default        | Description                                                                                                                                            |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--animation-delay`           | `0`            | Sets when the animation will start.                                                                                                                    |
| `--animation-direction`       | `normal`       | Defines whether or not the animation should play in reverse on alternate cycles.                                                                       |
| `--animation-duration`        | `1s`           | Defines the length of time that an animation takes to complete one cycle.                                                                              |
| `--animation-iteration-count` | `infinite`     | Defines the number of times an animation cycle is played.                                                                                              |
| `--animation-timing`          | -              | Describes how the animation will progress over one cycle of its duration.                                                                              |
| `--beat-fade-opacity`         | -              | Set lowest opacity value an icon with `beat-fade` animation will fade to and from.                                                                     |
| `--beat-fade-scale`           | -              | Set max value that an icon with `beat-fade` animation will scale.                                                                                      |
| `--beat-scale`                | -              | Set max value that an icon with `beat` animation will scale.                                                                                           |
| `--bounce-height`             | -              | Set the max height an icon with `bounce` animation will jump to when bouncing.                                                                         |
| `--bounce-jump-scale-x`       | -              | Set the icon’s horizontal distortion (“squish”) at the top of the jump.                                                                                |
| `--bounce-jump-scale-y`       | -              | Set the icon’s vertical distortion (“squish”) at the top of the jump.                                                                                  |
| `--bounce-land-scale-x`       | -              | Set the icon’s horizontal distortion (“squish”) when landing after the jump.                                                                           |
| `--bounce-land-scale-y`       | -              | Set the icon’s vertical distortion (“squish”) when landing after the jump.                                                                             |
| `--bounce-rebound`            | -              | Set the amount of rebound an icon with `bounce` animation has when landing after the jump.                                                             |
| `--bounce-start-scale-x`      | -              | Set the icon’s horizontal distortion (“squish”) when starting to bounce.                                                                               |
| `--bounce-start-scale-y`      | -              | Set the icon’s vertical distortion (“squish”) when starting to bounce.                                                                                 |
| `--fade-opacity`              | -              | Set lowest opacity value an icon with `fade` animation will fade to and from.                                                                          |
| `--flip-angle`                | -              | Set rotation angle of flip for an icon with `flip` animation. A positive angle denotes a clockwise rotation, a negative angle a counter-clockwise one. |
| `--flip-x`                    | -              | Set x-coordinate of the vector denoting the axis of rotation (between 0 and 1) for an icon with `flip` animation.                                      |
| `--flip-y`                    | -              | Set y-coordinate of the vector denoting the axis of rotation (between 0 and 1) for an icon with `flip` animation.                                      |
| `--flip-z`                    | -              | Set z-coordinate of the vector denoting the axis of rotation (between 0 and 1) for an icon with `flip` animation.                                      |
| `--primary-color`             | `currentColor` | Sets a duotone icon's primary color.                                                                                                                   |
| `--primary-opacity`           | `1`            | Sets a duotone icon's primary opacity.                                                                                                                 |
| `--secondary-color`           | `currentColor` | Sets a duotone icon's secondary color.                                                                                                                 |
| `--secondary-opacity`         | `0.4`          | Sets a duotone icon's secondary opacity.                                                                                                               |

## Installation

```bash
npx kigumi add icon
```

---

**Documentation**: [webawesome.com/docs/components/icon](https://webawesome.com/docs/components/icon)
