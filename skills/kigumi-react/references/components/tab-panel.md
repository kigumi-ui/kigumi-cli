# TabPanel

**Web Awesome**: `wa-tab-panel`  
**Kigumi React**: `<TabPanel>`  
**Category**: Navigation  
**Tier**: free

React wrapper component for the Web Awesome `wa-tab-panel` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tab-panel name="''" active>Click me</wa-tab-panel>
```

```tsx
// Kigumi React
import { TabPanel } from "@/components/ui";

<TabPanel name="''" active={true}>
  Click me
</TabPanel>;
```

## Props

| Prop     | Type    | Values | Default | Description                |
| -------- | ------- | ------ | ------- | -------------------------- |
| `name`   | string  | -      | `''`    | The panel name             |
| `active` | boolean | -      | `false` | Whether the panel is shown |

## Installation

```bash
npx kigumi add tab-panel
```

---

**Documentation**: [webawesome.com/docs/components/tab-panel](https://webawesome.com/docs/components/tab-panel)
