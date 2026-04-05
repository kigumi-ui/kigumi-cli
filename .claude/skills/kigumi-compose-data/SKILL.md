---
name: kigumi-compose-data
description: >
  Display and organize data using Kigumi components including tables, lists,
  detail views, stats cards, and data visualization. Use when the user asks
  to create a data table, list view, detail panel, stats dashboard, metric
  cards, progress indicators, empty state, loading state, or any feature
  that displays structured data.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Compose Data Displays

Build data-heavy UIs: tables, stats, lists, detail views, loading/empty states.

## When to Use

- **Stats dashboard** (metric cards, KPIs)
- **Data table** (sortable, paginated, filterable rows with status badges)
- **List view** (cards with avatar + content + actions)
- **Detail view** (key-value pairs in a card)
- **Empty state** (no data placeholder)
- **Loading state** (skeleton screens)

## Critical Rules

1. **No `<wa-table>` exists.** Use native HTML `<table>` with WA CSS variables for styling. A DataGrid component is planned by Web Awesome but not yet available.
2. **Use formatting components** for data values: FormatNumber, FormatDate, FormatBytes, RelativeTime.
3. **Use Skeleton** for loading states that match the expected layout shape.
4. **Use Badge** for status indicators with semantic variants (success, warning, danger).
5. **All tables must be accessible:** include `<caption>` (use `className="wa-visually-hidden"` in React / `class="wa-visually-hidden"` in Vue/Angular for visually hidden), `scope="col"` on every `<th>`, and `aria-sort` on sortable columns.
6. **All tables must be responsive:** wrap in `<div style={{ overflowX: 'auto' }}>` (React) / `<div style="overflow-x: auto">` (Vue/Angular) with `minWidth` on the table.
7. **Install data components BEFORE generating code:** `npx kigumi add badge format-number skeleton`. Never use raw `<wa-*>` tags.
8. **Vue slots:** Use `slot="header"` attribute on child elements, NOT `<template #header>`.

## Component Selection

| Need                       | Component                      | Tier |
| -------------------------- | ------------------------------ | ---- |
| Currency, percent, decimal | `FormatNumber`                 | free |
| Dates and times            | `FormatDate`                   | free |
| "5 days ago"               | `RelativeTime`                 | free |
| File sizes                 | `FormatBytes`                  | free |
| Status indicator           | `Badge`                        | free |
| Progress                   | `ProgressBar` / `ProgressRing` | free |
| Loading placeholder        | `Skeleton`                     | free |
| Inline chart               | `Sparkline`                    | pro  |

## Decision Tree

```
User needs data display
|
+-- Overview metrics? --> Stats Dashboard (A)
+-- Tabular data?
|   +-- Needs sorting? --> Sortable Table (B2)
|   +-- Needs pagination? --> Paginated Table (B3)
|   +-- Needs search/filter? --> Filtered Table (B4)
|   +-- Needs multiple? --> Combine B2 + B3 + B4
|   +-- Simple read-only? --> Data Table (B)
+-- Card-based list? --> List View (C)
+-- Single item details? --> Detail View (D)
+-- No data yet? --> Empty State (E)
+-- Data loading? --> Loading State (F)
```

## Pattern Index

| ID  | Pattern         | Features                                | React | Vue |
| --- | --------------- | --------------------------------------- | ----- | --- |
| A   | Stats Dashboard | Metric cards, KPIs, trend badges        | yes   | yes |
| B   | Data Table      | Static rows, status badges, actions     | yes   | yes |
| B2  | Sortable Table  | Column sort, aria-sort, sort icons      | yes   | yes |
| B3  | Paginated Table | Page nav, page size, "Showing X-Y of Z" | yes   | yes |
| B4  | Filtered Table  | Debounced search, result count          | yes   | yes |
| C   | List View       | Avatar + content + actions cards        | yes   | yes |
| D   | Detail View     | Key-value pairs in a card               | yes   | yes |
| E   | Empty State     | No-data placeholder with CTA            | yes   | yes |
| F   | Loading State   | Skeleton screens (table + card grid)    | yes   | yes |

## References

- [React API Surface](../shared/react-api-surface.md) / [Vue API Surface](../shared/vue-api-surface.md) / [Angular API Surface](../shared/angular-api-surface.md) -- component props, events, slots, CSS parts
- [Data Display Patterns](references/data-display-patterns.md) -- 9 patterns with React + Vue
- [Data Patterns Angular](references/data-patterns-angular.md) -- 7 patterns as Angular standalone components (Stats, Table, Sortable, List, Detail, Empty, Loading)

**Angular:** If `framework: "angular"` in `kigumi.config.json`, use patterns from `references/data-patterns-angular.md`. Angular uses `class` (same as Vue), `@for` with `track`, component `styles` for table cell styling instead of inline style objects.

- [Formatting Components](references/formatting-components.md) -- FormatNumber, FormatDate, etc.

## Related Skills

- **kigumi-compose-layout** -- use the Data Browser page archetype to wrap a data table with sidebar filters, breadcrumbs, and page-level layout
- **kigumi-compose-overlay** -- use for detail drawers (slide-out panels) and delete confirmation dialogs triggered from table rows
- **kigumi-compose-form** -- use for inline editing patterns and filter forms above tables
