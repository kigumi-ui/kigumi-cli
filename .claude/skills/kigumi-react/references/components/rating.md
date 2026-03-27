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
import { Rating } from '@/components/ui';

<Rating label="''" value="0">
  Click me
</Rating>;
```

## Props

| Prop        | Type    | Values                         | Default  | Description                  |
| ----------- | ------- | ------------------------------ | -------- | ---------------------------- |
| `label`     | string  | -                              | `''`     | Accessible label             |
| `value`     | number  | -                              | `0`      | Current rating value         |
| `max`       | number  | -                              | `5`      | Maximum rating value         |
| `precision` | number  | -                              | `1`      | Rating precision (e.g., 0.5) |
| `readonly`  | boolean | -                              | `false`  | Makes the rating readonly    |
| `disabled`  | boolean | -                              | `false`  | Disables the rating          |
| `size`      | string  | 'small' \| 'medium' \| 'large' | `medium` | Rating size                  |

## Events

| Event      | React Handler | Type          | Description                                                                                                                                                                                                                                 |
| ---------- | ------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `change`   | `onChange`    | `Event`       | Emitted when the rating's value changes.                                                                                                                                                                                                    |
| `wa-hover` | `onWaHover`   | `CustomEvent` | Emitted when the user hovers over a value. The `phase` property indicates when hovering starts, moves to a new value, or ends. The `value` property tells what the rating's value would be if the user were to commit to the hovered value. |

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## CSS Custom Properties

| Property                | Default | Description                        |
| ----------------------- | ------- | ---------------------------------- |
| `--symbol-color`        | -       | The inactive color for symbols.    |
| `--symbol-color-active` | -       | The active color for symbols.      |
| `--symbol-spacing`      | -       | The spacing to use around symbols. |

## Methods

| Method    | Parameters              | Description                    |
| --------- | ----------------------- | ------------------------------ |
| `focus()` | `options: FocusOptions` | Sets focus on the rating.      |
| `blur()`  | -                       | Removes focus from the rating. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add rating
```

---

**Documentation**: [webawesome.com/docs/components/rating](https://webawesome.com/docs/components/rating)
