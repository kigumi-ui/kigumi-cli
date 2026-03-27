# BreadcrumbItem

**Web Awesome**: `wa-breadcrumb-item`  
**Kigumi React**: `<BreadcrumbItem>`  
**Category**: Navigation  
**Tier**: free

React wrapper component for the Web Awesome `wa-breadcrumb-item` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-breadcrumb-item href="value" target="_blank">Click me</wa-breadcrumb-item>
```

```tsx
// Kigumi React
import { BreadcrumbItem } from '@/components/ui';

<BreadcrumbItem href="value" target="_blank">
  Click me
</BreadcrumbItem>;
```

## Props

| Prop     | Type   | Values                                         | Default               | Description                                       |
| -------- | ------ | ---------------------------------------------- | --------------------- | ------------------------------------------------- |
| `href`   | string | -                                              | `-`                   | Optional URL to direct the user to when activated |
| `target` | string | '\_blank' \| '\_parent' \| '\_self' \| '\_top' | `-`                   | Tells the browser where to open the link          |
| `rel`    | string | -                                              | `noreferrer noopener` | The rel attribute to use on the link              |

## Slots

| Slot        | Description                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(default)_ | The breadcrumb item's label.                                                                                                                                                                          |
| `start`     | An element, such as `<wa-icon>`, placed before the label.                                                                                                                                             |
| `end`       | An element, such as `<wa-icon>`, placed after the label.                                                                                                                                              |
| `separator` | The separator to use for the breadcrumb item. This will only change the separator for this item. If you want to change it for all items in the group, set the separator on `<wa-breadcrumb>` instead. |

## CSS Parts

| Part        | Description                                |
| ----------- | ------------------------------------------ |
| `label`     | The breadcrumb item's label.               |
| `start`     | The container that wraps the `start` slot. |
| `end`       | The container that wraps the `end` slot.   |
| `separator` | The container that wraps the separator.    |

## Installation

```bash
npx kigumi add breadcrumb-item
```

---

**Documentation**: [webawesome.com/docs/components/breadcrumb-item](https://webawesome.com/docs/components/breadcrumb-item)
