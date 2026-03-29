---
name: kigumi-compose-layout
description: >
  Build page layouts, dashboards, app shells, and responsive structures using
  Kigumi components and Web Awesome layout utilities. Use when the user asks to
  create a dashboard, admin panel, landing page, settings page, sidebar layout,
  app shell, responsive grid, or any page-level structure. Also use when the user
  mentions .wa-stack, .wa-grid, .wa-cluster, .wa-flank, .wa-frame, or .wa-split.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Compose Layouts

Build page-level layouts using Kigumi components and Web Awesome CSS layout utilities.

## When to Use

- A **dashboard** (metric cards, charts, activity feeds)
- An **app shell** (sidebar navigation + content area)
- A **landing page** (hero, features grid, testimonials)
- A **settings page** (tabbed sections with form groups)
- A **data browser** (filters sidebar + data table)
- Any **page-level structure** or **responsive layout**

## Prerequisites

1. Read `kigumi.config.json` for framework, tier, and `componentsDir`.
2. Check installed components via `ls {componentsDir}/`.
3. **Install missing components BEFORE generating code:** `npx kigumi add <component>`. Never use raw `<wa-*>` tags directly.
4. Check tier: if Pro, prefer `<Page>` for app shells/dashboards over manual `.wa-flank` layouts.

## Critical Rules

1. **React: `className`. Vue: `class`.** Both apply to HTML elements and Kigumi wrappers alike.

```tsx
// React
<div className="wa-grid wa-gap-l">
  <Card className="my-custom-class">...</Card>
</div>
```

```vue
<!-- Vue -->
<div class="wa-grid wa-gap-l">
  <Card class="my-custom-class">...</Card>
</div>
```

2. **WA layouts are inherently responsive.** `.wa-grid` auto-wraps. `.wa-flank` stacks on narrow screens. Rarely need `@media` queries.

3. **Use semantic HTML.** `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` with `aria-label` on regions.

4. **`.wa-flank` sidebar layouts need `wa-align-items-stretch`** for full-height sidebars. Without it, the sidebar is vertically centered.

```html
<!-- CORRECT -- sidebar stretches full height -->
<div class="wa-flank wa-align-items-stretch" style="--flank-size: 240px">
  <!-- WRONG -- sidebar is vertically centered -->
  <div class="wa-flank" style="--flank-size: 240px"></div>
</div>
```

5. **Icon + text in `.wa-cluster`:** Text elements default to 100% width and wrap to the next line. Add `flex: 1; min-width: 0` to the text element.

```html
<div class="wa-cluster wa-gap-s wa-align-items-center">
  <Icon name="info" style="flex-shrink: 0" />
  <p style="flex: 1; min-width: 0; margin: 0">Text next to icon</p>
</div>
```

6. **Vue slots:** Use `slot="header"` attribute on child elements, NOT `<template #header>`. Kigumi Vue wrappers pass content through to the web component's shadow DOM slots.

```vue
<!-- CORRECT -->
<Card><div slot="header">Title</div></Card>

<!-- WRONG -- content silently disappears -->
<Card><template #header>Title</template></Card>
```

## The 6 Layout Primitives

| Utility       | Purpose                    | Use For                           |
| ------------- | -------------------------- | --------------------------------- |
| `.wa-stack`   | Vertical flex column       | Forms, vertical content, sections |
| `.wa-grid`    | Auto-fit responsive grid   | Card grids, dashboards            |
| `.wa-cluster` | Horizontal flex with wrap  | Tags, button groups, chips        |
| `.wa-flank`   | Sidebar + main content     | App shells, search layouts        |
| `.wa-frame`   | Aspect-ratio container     | Images, video embeds              |
| `.wa-split`   | Space-between distribution | Headers, footers, nav bars        |

## Color Sections

| Utility    | Purpose                        | Use For                                  |
| ---------- | ------------------------------ | ---------------------------------------- |
| `.wa-dark` | Invert color tokens in subtree | Dark hero sections, CTA banners, footers |

Apply `.wa-dark` to any container to auto-invert all `--wa-color-*` tokens. Works on `<section>`, `<div>`, or even individual Kigumi components. See [Layout Utilities](references/layout-utilities-complete.md#dark-sections-with-wa-dark) for examples.

## Archetype Selection

```
User describes a page
|
+-- Is Page installed? (Pro tier)
|   +-- YES --> Page Shell (F) -- handles navigation, mobile drawer, header/footer automatically
|   +-- NO  --> continue below
|
+-- Has sidebar navigation? --> App Shell (A) + inner layout
|
+-- Primary content?
    +-- Metric cards + sections --> Dashboard (B)
    +-- Grouped settings/forms --> Settings Page (C)
    +-- Marketing sections --> Landing Page (D)
    +-- Filterable data --> Data Browser (E)
```

**Pro users:** Always check if `Page` is installed first. It provides responsive navigation, mobile hamburger drawer, header/subheader/footer slots, and skip-to-content -- all for free. Manual `.wa-flank` layouts cannot match this.

## Framework Notes

**React:** `className="wa-stack wa-gap-l"`, custom properties via `style={{ '--min-column-size': '250px' } as React.CSSProperties}`

**Vue:** `class="wa-stack wa-gap-l"`, custom properties via `style="--min-column-size: 250px"`

## Output Format

1. ASCII layout diagram
2. Install commands for missing components
3. Complete component with semantic HTML + layout utilities
4. Responsive behavior notes

## Related Skills

- **kigumi-compose-form** -- for settings page form content, validated inputs, multi-step wizards
- **kigumi-compose-data** -- for dashboard metrics, data browser tables, stats cards, empty states
- **kigumi-compose-overlay** -- for side panels, notification drawers, confirmation dialogs

## References

- [React API Surface](../shared/react-api-surface.md) / [Vue API Surface](../shared/vue-api-surface.md) -- component props, events, slots, CSS parts
- [Layout Archetypes](references/layout-archetypes.md) -- 6 page archetypes with React + Vue code
- [Layout Utilities Complete](references/layout-utilities-complete.md) -- all .wa-\* classes, typography utilities
- [Responsive Patterns](references/responsive-patterns.md) -- responsive strategy
