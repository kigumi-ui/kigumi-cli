# Breadcrumb

**Web Awesome**: `wa-breadcrumb`  
**Kigumi React**: `<Breadcrumb>`  
**Category**: Navigation  
**Tier**: free

React wrapper component for the Web Awesome `wa-breadcrumb` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-breadcrumb label="''">Click me</wa-breadcrumb>
```

```tsx
// Kigumi React
import { Breadcrumb } from '@/components/ui';

<Breadcrumb label="''">Click me</Breadcrumb>;
```

## Props

| Prop    | Type   | Values | Default | Description                                                       |
| ------- | ------ | ------ | ------- | ----------------------------------------------------------------- |
| `label` | string | -      | `''`    | The label to use for the breadcrumb control for assistive devices |

## Slots

| Slot        | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| _(default)_ | One or more breadcrumb items to display.                                    |
| `separator` | The separator to use between breadcrumb items. Works best with `<wa-icon>`. |

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add breadcrumb
```

---

**Documentation**: [webawesome.com/docs/components/breadcrumb](https://webawesome.com/docs/components/breadcrumb)
