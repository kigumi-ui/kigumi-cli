# Responsive Patterns

## Built-In Responsiveness

Web Awesome layout utilities are inherently responsive. You rarely need `@media` queries.

### .wa-grid Auto-Wrap

`.wa-grid` uses CSS `auto-fit` with `minmax()`. Columns wrap automatically when they would be narrower than `--min-column-size`.

```tsx
// 3 columns on desktop, 2 on tablet, 1 on mobile -- no media queries
<div className="wa-grid" style={{ '--min-column-size': '280px' } as React.CSSProperties}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

**Control columns by adjusting `--min-column-size`:**
- `150px` -- more columns, smaller cards (thumbnail grid)
- `250px` -- balanced (dashboard metrics)
- `350px` -- fewer columns, wider cards (feature cards)
- `500px` -- 1-2 columns max (article layout)

### .wa-flank Auto-Stack

`.wa-flank` stacks vertically when main content would be narrower than `--content-percentage`.

```tsx
// Sidebar + main on desktop, stacked on mobile -- no media queries
<div className="wa-flank" style={{ '--flank-size': '240px', '--content-percentage': '60%' } as React.CSSProperties}>
  <aside>Sidebar</aside>
  <main>Content</main>
</div>
```

**Control wrap point by adjusting `--content-percentage`:**
- `40%` -- sidebar stays visible longer (wide sidebar)
- `60%` -- balanced (typical app shell)
- `75%` -- sidebar collapses early (narrow sidebar)

## When You DO Need @media Queries

Rare cases where WA utilities alone are not enough:

1. **Hiding elements entirely** -- sidebar nav hidden on mobile, replaced by hamburger menu
2. **Changing layout primitive** -- grid on desktop, stack on mobile (if auto-wrap doesn't fit)
3. **Font size adjustments** -- headings smaller on mobile
4. **Fixed positioning** -- bottom nav bar on mobile only

```css
/* Example: hide sidebar on mobile, show hamburger */
@media (max-width: 768px) {
  .app-sidebar { display: none; }
  .mobile-menu-trigger { display: block; }
}
```

## Responsive Dashboard Example

A dashboard that works across screen sizes using only WA utilities:

```tsx
export function ResponsiveDashboard() {
  return (
    <div className="wa-flank wa-gap-0" style={{ '--flank-size': '220px', '--content-percentage': '65%' } as React.CSSProperties}>
      {/* Sidebar: stacks above content on narrow screens */}
      <nav className="wa-stack wa-gap-xs" style={{ padding: 'var(--wa-space-m)' }}>
        <strong>Dashboard</strong>
        {/* nav items */}
      </nav>

      <main className="wa-stack wa-gap-l" style={{ padding: 'var(--wa-space-l)' }}>
        {/* Metrics: 3 cols desktop, 1-2 cols tablet, 1 col mobile */}
        <div className="wa-grid" style={{ '--min-column-size': '200px' } as React.CSSProperties}>
          <Card>Metric 1</Card>
          <Card>Metric 2</Card>
          <Card>Metric 3</Card>
        </div>

        {/* Content: 2 cols desktop, stacked mobile */}
        <div className="wa-grid" style={{ '--min-column-size': '350px' } as React.CSSProperties}>
          <Card>Chart / Activity Feed</Card>
          <Card>Recent Items</Card>
        </div>
      </main>
    </div>
  );
}
```

This layout produces:
- **Desktop (>1200px):** Sidebar | 3 metric cards + 2 content cards side-by-side
- **Tablet (~800px):** Sidebar | 2 metric cards per row + stacked content
- **Mobile (<600px):** Everything stacked vertically, sidebar on top
