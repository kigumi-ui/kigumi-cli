# Include

**Web Awesome**: `wa-include`  
**Kigumi React**: `<Include>`  
**Category**: Utilities  
**Tier**: free

React wrapper component for the Web Awesome `wa-include` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-include src="value" mode="cors">Click me</wa-include>
```

```tsx
// Kigumi React
import { Include } from "@/components/ui";

<Include src="value" mode="cors">
  Click me
</Include>;
```

## Props

| Prop            | Type    | Values                               | Default | Description                              |
| --------------- | ------- | ------------------------------------ | ------- | ---------------------------------------- |
| `src`           | string  | -                                    | `-`     | The location of the HTML file to include |
| `mode`          | string  | 'cors' \| 'no-cors' \| 'same-origin' | `cors`  | The fetch mode                           |
| `allow-scripts` | boolean | -                                    | `false` | Allows included scripts to be executed   |

## Installation

```bash
npx kigumi add include
```

---

**Documentation**: [webawesome.com/docs/components/include](https://webawesome.com/docs/components/include)
