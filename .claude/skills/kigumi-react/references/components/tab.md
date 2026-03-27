# Tab

**Web Awesome**: `wa-tab`  
**Kigumi React**: `<Tab>`  
**Category**: Navigation  
**Tier**: free

React wrapper component for the Web Awesome `wa-tab` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tab panel="value" disabled>Click me</wa-tab>
```

```tsx
// Kigumi React
import { Tab } from '@/components/ui';

<Tab panel="value" disabled={true}>
  Click me
</Tab>;
```

## Props

| Prop       | Type    | Values | Default | Description           |
| ---------- | ------- | ------ | ------- | --------------------- |
| `panel`    | string  | -      | `-`     | Associated panel name |
| `disabled` | boolean | -      | `false` | Disables the tab      |

## Slots

| Slot        | Description      |
| ----------- | ---------------- |
| _(default)_ | The tab's label. |

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add tab
```

---

**Documentation**: [webawesome.com/docs/components/tab](https://webawesome.com/docs/components/tab)
