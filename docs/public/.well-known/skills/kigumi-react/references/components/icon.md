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

| Prop           | Type    | Values | Default   | Description                                                          |
| -------------- | ------- | ------ | --------- | -------------------------------------------------------------------- |
| `name`         | string  | -      | `-`       | The name of the icon to draw                                         |
| `library`      | string  | -      | `default` | The name of a registered custom icon library                         |
| `src`          | string  | -      | `-`       | An external URL of an SVG file                                       |
| `label`        | string  | -      | `''`      | An alternate description for assistive devices                       |
| `family`       | string  | -      | `-`       | The family of icons (classic, brands, sharp, duotone, sharp-duotone) |
| `variant`      | string  | -      | `-`       | The icon's variant (thin, light, regular, solid)                     |
| `auto-width`   | boolean | -      | `false`   | Sets the width to match the cropped SVG viewBox                      |
| `swap-opacity` | boolean | -      | `false`   | Swaps the opacity of duotone icons                                   |

## Installation

```bash
npx kigumi add icon
```

---

**Documentation**: [webawesome.com/docs/components/icon](https://webawesome.com/docs/components/icon)
