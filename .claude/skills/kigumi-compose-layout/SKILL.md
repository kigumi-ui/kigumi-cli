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

1. Read `kigumi.config.json` for framework and `componentsDir`.
2. Check installed components via `ls {componentsDir}/`.
3. Suggest `npx kigumi add` for missing components.

## Critical Rules

1. **`className` on HTML elements, `class` on Kigumi components.**

```tsx
// CORRECT
<div className="wa-grid wa-gap-l">
  <Card>...</Card>
</div>

// WRONG -- className does not propagate through Shadow DOM
<Card className="wa-grid">...</Card>
```

2. **WA layouts are inherently responsive.** `.wa-grid` auto-wraps. `.wa-flank` stacks on narrow screens. Rarely need `@media` queries.

3. **Use semantic HTML.** `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` with `aria-label` on regions.

## The 6 Layout Primitives

| Utility | Purpose | Use For |
|---------|---------|---------|
| `.wa-stack` | Vertical flex column | Forms, vertical content, sections |
| `.wa-grid` | Auto-fit responsive grid | Card grids, dashboards |
| `.wa-cluster` | Horizontal flex with wrap | Tags, button groups, chips |
| `.wa-flank` | Sidebar + main content | App shells, search layouts |
| `.wa-frame` | Aspect-ratio container | Images, video embeds |
| `.wa-split` | Space-between distribution | Headers, footers, nav bars |

## Archetype Selection

```
User describes a page
|
+-- Has sidebar navigation? --> App Shell (A) + inner layout
|
+-- Primary content?
    +-- Metric cards + sections --> Dashboard (B)
    +-- Grouped settings/forms --> Settings Page (C)
    +-- Marketing sections --> Landing Page (D)
    +-- Filterable data --> Data Browser (E)
```

## Framework Notes

**React:** `className="wa-stack wa-gap-l"`, custom properties via `style={{ '--min-column-size': '250px' } as React.CSSProperties}`

**Vue:** `class="wa-stack wa-gap-l"`, custom properties via `style="--min-column-size: 250px"`

## Output Format

1. ASCII layout diagram
2. Install commands for missing components
3. Complete component with semantic HTML + layout utilities
4. Responsive behavior notes

## References

- [Layout Archetypes](references/layout-archetypes.md) -- 5 page archetypes with React + Vue code
- [Layout Utilities Complete](references/layout-utilities-complete.md) -- all .wa-* classes
- [Responsive Patterns](references/responsive-patterns.md) -- responsive strategy
