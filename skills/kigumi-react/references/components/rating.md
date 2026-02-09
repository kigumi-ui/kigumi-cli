# Rating

**Web Awesome**: `wa-rating`  
**Kigumi React**: `<Rating>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-rating` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-rating label="''" value="0">Click me</wa-rating>
```

```tsx
// Kigumi React
import { Rating } from "@/components/ui";

<Rating label="''" value="0">
  Click me
</Rating>;
```

## Props

| Prop        | Type    | Values | Default | Description                  |
| ----------- | ------- | ------ | ------- | ---------------------------- |
| `label`     | string  | -      | `''`    | Accessible label             |
| `value`     | number  | -      | `0`     | Current rating value         |
| `max`       | number  | -      | `5`     | Maximum rating value         |
| `precision` | number  | -      | `1`     | Rating precision (e.g., 0.5) |
| `readonly`  | boolean | -      | `false` | Makes the rating readonly    |
| `disabled`  | boolean | -      | `false` | Disables the rating          |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add rating
```

---

**Documentation**: [webawesome.com/docs/components/rating](https://webawesome.com/docs/components/rating)
