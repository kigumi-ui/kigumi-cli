# Tree

**Web Awesome**: `wa-tree`  
**Kigumi React**: `<Tree>`  
**Category**: Navigation  
**Tier**: free

React wrapper component for the Web Awesome `wa-tree` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tree selection="single">Click me</wa-tree>
```

```tsx
// Kigumi React
import { Tree } from '@/components/ui';

<Tree selection="single">Click me</Tree>;
```

## Props

| Prop        | Type   | Values                           | Default  | Description        |
| ----------- | ------ | -------------------------------- | -------- | ------------------ |
| `selection` | string | 'single' \| 'multiple' \| 'leaf' | `single` | Selection behavior |

## Installation

```bash
npx kigumi add tree
```

---

**Documentation**: [webawesome.com/docs/components/tree](https://webawesome.com/docs/components/tree)
