# Divider

**Web Awesome**: `wa-divider`  
**Kigumi React**: `<Divider>`  
**Category**: Layout  
**Tier**: free

React wrapper component for the Web Awesome `wa-divider` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-divider orientation="horizontal">Click me</wa-divider>
```

```tsx
// Kigumi React
import { Divider } from '@/components/ui';

<Divider orientation="horizontal">Click me</Divider>;
```

## Props

| Prop          | Type   | Values                     | Default      | Description         |
| ------------- | ------ | -------------------------- | ------------ | ------------------- |
| `orientation` | string | 'horizontal' \| 'vertical' | `horizontal` | Divider orientation |

## CSS Custom Properties

| Property    | Default | Description                 |
| ----------- | ------- | --------------------------- |
| `--color`   | -       | The color of the divider.   |
| `--width`   | -       | The width of the divider.   |
| `--spacing` | -       | The spacing of the divider. |

## Installation

```bash
npx kigumi add divider
```

---

**Documentation**: [webawesome.com/docs/components/divider](https://webawesome.com/docs/components/divider)
