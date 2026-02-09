# Button

**Web Awesome**: `wa-button`  
**Kigumi React**: `<Button>`  
**Category**: Actions  
**Tier**: free

React wrapper component for the Web Awesome `wa-button` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-button variant="neutral" appearance="accent">Click me</wa-button>
```

```tsx
// Kigumi React
import { Button } from "@/components/ui";

<Button variant="neutral" appearance="accent">
  Click me
</Button>;
```

## Props

| Prop         | Type    | Values                                                             | Default   | Description                          |
| ------------ | ------- | ------------------------------------------------------------------ | --------- | ------------------------------------ |
| `variant`    | string  | 'neutral' \| 'brand' \| 'success' \| 'warning' \| 'danger'         | `neutral` | Semantic variant of the button       |
| `appearance` | string  | 'accent' \| 'filled-outlined' \| 'filled' \| 'outlined' \| 'plain' | `filled`  | Visual appearance style              |
| `size`       | string  | 'small' \| 'medium' \| 'large'                                     | `medium`  | Button size                          |
| `pill`       | boolean | -                                                                  | `false`   | Gives the button rounded edges       |
| `disabled`   | boolean | -                                                                  | `false`   | Disables the button                  |
| `loading`    | boolean | -                                                                  | `false`   | Shows a loading indicator            |
| `with-caret` | boolean | -                                                                  | `false`   | Adds a dropdown indicator caret      |
| `href`       | string  | -                                                                  | `-`       | Makes the button work like a link    |
| `target`     | string  | '\_blank' \| '\_self' \| '\_parent' \| '\_top'                     | `-`       | Link target (when href is set)       |
| `download`   | string  | -                                                                  | `-`       | Download filename (when href is set) |
| `rel`        | string  | -                                                                  | `-`       | Link relationship (when href is set) |

## Installation

```bash
npx kigumi add button
```

---

**Documentation**: [webawesome.com/docs/components/button](https://webawesome.com/docs/components/button)
