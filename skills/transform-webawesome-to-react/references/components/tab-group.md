# TabGroup

**Web Awesome**: `wa-tab-group`  
**Kigumi React**: `<TabGroup>`  
**Category**: Navigation  
**Tier**: free

React wrapper component for the Web Awesome `wa-tab-group` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tab-group placement="top" activation="auto">Click me</wa-tab-group>
```

```tsx
// Kigumi React
import { TabGroup } from '@/components/ui';

<TabGroup placement="top" activation="auto">
  Click me
</TabGroup>;
```

## Props

| Prop                      | Type    | Values                                | Default | Description             |
| ------------------------- | ------- | ------------------------------------- | ------- | ----------------------- |
| `placement`               | string  | 'top' \| 'bottom' \| 'start' \| 'end' | `top`   | Tab position            |
| `activation`              | string  | 'auto' \| 'manual'                    | `auto`  | Panel activation method |
| `without-scroll-controls` | boolean | -                                     | `false` | Disables scroll buttons |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add tab-group
```

---

**Documentation**: [webawesome.com/docs/components/tab-group](https://webawesome.com/docs/components/tab-group)
