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

| Slot                     | Description                                                                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _(default)_              | The page's main content.                                                                                                                                                                                                                                                                 |
| `banner`                 | The banner that gets display above the header. The banner will not be shown if no content is provided.                                                                                                                                                                                   |
| `header`                 | The header to display at the top of the page. If a banner is present, the header will appear below the banner. The header will not be shown if there is no content.                                                                                                                      |
| `subheader`              | A subheader to display below the `header`. This is a good place to put things like breadcrumbs.                                                                                                                                                                                          |
| `menu`                   | The left side of the page. If you slot an element in here, you will override the default `navigation` slot and will be handling navigation on your own. This also will not disable the fallback behavior of the navigation button. This section "sticks" to the top as the page scrolls. |
| `navigation-header`      | The header for a navigation area. On mobile this will be the header for `<wa-drawer>`.                                                                                                                                                                                                   |
| `navigation`             | The main content to display in the navigation area. This is displayed on the left side of the page, if `menu` is not used. This section "sticks" to the top as the page scrolls.                                                                                                         |
| `navigation-footer`      | The footer for a navigation area. On mobile this will be the footer for `<wa-drawer>`.                                                                                                                                                                                                   |
| `navigation-toggle`      | Use this slot to slot in your own button + icon for toggling the navigation drawer. By default it is a `<wa-button>` + a 3 bars `<wa-icon>`                                                                                                                                              |
| `navigation-toggle-icon` | Use this to slot in your own icon for toggling the navigation drawer. By default it is 3 bars `<wa-icon>`.                                                                                                                                                                               |
| `main-header`            | Header to display inline above the main content.                                                                                                                                                                                                                                         |
| `main-footer`            | Footer to display inline below the main content.                                                                                                                                                                                                                                         |
| `aside`                  | Content to be shown on the right side of the page. Typically contains a table of contents, ads, etc. This section "sticks" to the top as the page scrolls.                                                                                                                               |
| `skip-to-content`        | The "skip to content" slot. You can override this If you would like to override the `Skip to content` button and add additional "Skip to X", they can be inserted here.                                                                                                                  |
| `footer`                 | The content to display in the footer. This is always displayed underneath the viewport so will always make the page "scrollable".                                                                                                                                                        |

## CSS Parts

| Part                     | Description                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `base`                   | The component's base wrapper.                                                                         |
| `banner`                 | The banner to show above header.                                                                      |
| `header`                 | The header, usually for top level navigation / branding.                                              |
| `subheader`              | Shown below the header, usually intended for things like breadcrumbs and other page level navigation. |
| `body`                   | The wrapper around menu, main, and aside.                                                             |
| `menu`                   | The left hand side of the page. Generally intended for navigation.                                    |
| `navigation`             | The `<nav>` that wraps the navigation slots on desktop viewports.                                     |
| `navigation-header`      | The header for a navigation area. On mobile this will be the header for `<wa-drawer>`.                |
| `navigation-footer`      | The footer for a navigation area. On mobile this will be the footer for `<wa-drawer>`.                |
| `navigation-toggle`      | The default `<wa-button>` that will toggle the `<wa-drawer>` for mobile viewports.                    |
| `navigation-toggle-icon` | The default `<wa-icon>` displayed inside of the navigation-toggle button.                             |
| `main-header`            | The header above main content.                                                                        |
| `main-content`           | The main content.                                                                                     |
| `main-footer`            | The footer below main content.                                                                        |
| `aside`                  | The right hand side of the page. Used for things like table of contents, ads, etc.                    |
| `skip-links`             | Wrapper around skip-link                                                                              |
| `skip-link`              | The "skip to main content" link                                                                       |
| `footer`                 | The footer of the page. This is always below the initial viewport size.                               |
| `dialog-wrapper`         | A wrapper around elements such as dialogs or other modal-like elements.                               |

## CSS Custom Properties

| Property             | Default | Description                                                                                                                                                       |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--menu-width`       | `auto`  | The width of the page's "menu" section.                                                                                                                           |
| `--main-width`       | `1fr`   | The width of the page's "main" section.                                                                                                                           |
| `--aside-width`      | `auto`  | The wide of the page's "aside" section.                                                                                                                           |
| `--banner-height`    | `0px`   | The height of the banner. This gets calculated when the page initializes. If the height is known, you can set it here to prevent shifting when the page loads.    |
| `--header-height`    | `0px`   | The height of the header. This gets calculated when the page initializes. If the height is known, you can set it here to prevent shifting when the page loads.    |
| `--subheader-height` | `0px`   | The height of the subheader. This gets calculated when the page initializes. If the height is known, you can set it here to prevent shifting when the page loads. |

## Methods

| Method                      | Parameters                     | Description                                                                                                                        |
| --------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `visiblePixelsInViewport()` | `element: HTMLElement \| null` | https://stackoverflow.com/a/26831113 This prevents awkward gaps when scrolling the page and the aside / menu dont "fill" the gaps. |
| `showNavigation()`          | -                              | Shows the mobile navigation drawer                                                                                                 |
| `hideNavigation()`          | -                              | Hides the mobile navigation drawer                                                                                                 |
| `toggleNavigation()`        | -                              | Toggles the mobile navigation drawer                                                                                               |

## Installation

```bash
npx kigumi add page
```

---

**Documentation**: [webawesome.com/docs/components/page](https://webawesome.com/docs/components/page)
