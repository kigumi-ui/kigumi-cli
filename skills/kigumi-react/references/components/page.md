# Page

**Web Awesome**: `wa-page`  
**Kigumi React**: `<Page>`  
**Category**: Layout  
**Tier**: pro

React wrapper component for the Web Awesome `wa-page` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-page disable-navigation-toggle mobile-breakpoint="768px">Click me</wa-page>
```

```tsx
// Kigumi React
import { Page } from "@/components/ui";

<Page disable-navigation-toggle={true} mobile-breakpoint="768px">
  Click me
</Page>;
```

## Props

| Prop                        | Type    | Values                | Default   | Description                                                                           |
| --------------------------- | ------- | --------------------- | --------- | ------------------------------------------------------------------------------------- |
| `disable-navigation-toggle` | boolean | -                     | `false`   | Hide default hamburger button; auto-sets true if custom toggle element present        |
| `mobile-breakpoint`         | string  | -                     | `768px`   | Viewport width threshold for navigation collapse; accepts numbers (px) or CSS lengths |
| `navigation-placement`      | string  | 'start' \| 'end'      | `start`   | Navigation drawer position on mobile                                                  |
| `nav-open`                  | boolean | -                     | `false`   | Mobile navigation drawer open state                                                   |
| `view`                      | string  | 'mobile' \| 'desktop' | `desktop` | Current viewport classification relative to breakpoint                                |

## Installation

```bash
npx kigumi add page
```

---

**Documentation**: [webawesome.com/docs/components/page](https://webawesome.com/docs/components/page)
