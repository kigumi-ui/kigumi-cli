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
import { Page } from '@/components/ui';

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

## Slots

| Slot | Wrapper Element | Purpose |
|------|----------------|---------|
| `header` | `<div slot="header">` | Top bar content (logo, navigation links, user menu) |
| `navigation` | `<nav slot="navigation">` | Mobile navigation drawer. Page auto-generates a hamburger toggle. |
| `footer` | `<div slot="footer">` | Page footer content |
| (default) | children | Main content area |

**Important:** React cannot forward the `slot` attribute on React components. Always use a wrapper HTML element:

```tsx
// CORRECT -- wrapper div with slot attribute
<Page>
  <div slot="header">Header content</div>
  <nav slot="navigation">Nav links</nav>
  Main content here
  <div slot="footer">Footer</div>
</Page>

// WRONG -- slot attribute on React component is ignored
<Page>
  <Header slot="header" />  {/* slot won't propagate */}
</Page>
```

## Mobile Navigation

Page automatically generates a hamburger toggle button on viewports narrower than `mobile-breakpoint`. The `navigation` slot content appears in a slide-out drawer.

To use a custom hamburger button instead of the built-in one, set `disable-navigation-toggle`:

```tsx
<Page disable-navigation-toggle>
  <div slot="header">
    <Button onClick={() => { /* custom toggle logic */ }}>
      <Icon name="bars" />
    </Button>
  </div>
  <nav slot="navigation">...</nav>
</Page>
```

## Installation

```bash
npx kigumi add page
```

---

**Documentation**: [webawesome.com/docs/components/page](https://webawesome.com/docs/components/page)
