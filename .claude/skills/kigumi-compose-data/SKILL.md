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
- **Data table** (sortable rows, status badges)
- **List view** (cards with avatar + content + actions)
- **Detail view** (key-value pairs in a card)
- **Empty state** (no data placeholder)
- **Loading state** (skeleton screens)

## Critical Rules

1. **No `<wa-table>` exists.** Use native HTML `<table>` with WA CSS variables for styling. A DataGrid component is planned by Web Awesome but not yet available.
2. **Use formatting components** for data values: FormatNumber, FormatDate, FormatBytes, RelativeTime.
3. **Use Skeleton** for loading states that match the expected layout shape.
4. **Use Badge** for status indicators with semantic variants (success, warning, danger).

## Component Selection

| Need | Component | Tier |
|------|-----------|------|
| Currency, percent, decimal | `FormatNumber` | free |
| Dates and times | `FormatDate` | free |
| "5 days ago" | `RelativeTime` | free |
| File sizes | `FormatBytes` | free |
| Status indicator | `Badge` | free |
| Progress | `ProgressBar` / `ProgressRing` | free |
| Loading placeholder | `Skeleton` | free |
| Inline chart | `Sparkline` | pro |

## Decision Tree

```
User needs data display
|
+-- Overview metrics? --> Stats Dashboard (A)
+-- Tabular data? --> HTML Table (B)
+-- Card-based list? --> List View (D)
+-- Single item details? --> Detail View (E)
+-- No data yet? --> Empty State (F)
+-- Data loading? --> Loading State (G)
```

## References

- [Data Display Patterns](references/data-display-patterns.md) -- 7 patterns with React + Vue
- [Formatting Components](references/formatting-components.md) -- FormatNumber, FormatDate, etc.
