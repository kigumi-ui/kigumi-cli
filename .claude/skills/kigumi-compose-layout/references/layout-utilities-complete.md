# Layout Utilities Complete Reference

## The 6 Primitives

| Utility | CSS | Purpose |
|---------|-----|---------|
| `.wa-stack` | `flex-direction: column` | Vertical stacking with gap |
| `.wa-grid` | `display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--min-column-size, 20ch), 1fr))` | Responsive auto-fit grid |
| `.wa-cluster` | `display: flex; flex-wrap: wrap` | Horizontal wrapping group |
| `.wa-flank` | `display: flex` (first child fixed, second fills) | Sidebar + main content |
| `.wa-frame` | `aspect-ratio + overflow: hidden + object-fit: cover` | Aspect-ratio container |
| `.wa-split` | `display: flex; justify-content: space-between` | Space-between distribution |

## Gap Scale

All primitives default to `--wa-space-m` gap. Override with:

| Class | Token | Approx px |
|-------|-------|-----------|
| `.wa-gap-0` | 0 | 0 |
| `.wa-gap-3xs` | `--wa-space-3xs` | ~2px |
| `.wa-gap-2xs` | `--wa-space-2xs` | ~4px |
| `.wa-gap-xs` | `--wa-space-xs` | ~8px |
| `.wa-gap-s` | `--wa-space-s` | ~12px |
| `.wa-gap-m` | `--wa-space-m` | ~16px |
| `.wa-gap-l` | `--wa-space-l` | ~24px |
| `.wa-gap-xl` | `--wa-space-xl` | ~32px |
| `.wa-gap-2xl` | `--wa-space-2xl` | ~40px |
| `.wa-gap-3xl` | `--wa-space-3xl` | ~48px |
| `.wa-gap-4xl` | `--wa-space-4xl` | ~64px |

Note: `.wa-gap-*` classes implicitly set `display: flex`.

## Alignment

Cross-axis (also set `display: flex`):

`.wa-align-items-start` `.wa-align-items-end` `.wa-align-items-center` `.wa-align-items-stretch` `.wa-align-items-baseline`

Per-item: `.wa-align-self-start` `.wa-align-self-end` `.wa-align-self-center` `.wa-align-self-stretch` `.wa-align-self-baseline`

Main-axis:

`.wa-justify-content-start` `.wa-justify-content-end` `.wa-justify-content-center` `.wa-justify-content-space-around` `.wa-justify-content-space-between` `.wa-justify-content-space-evenly`

## Flex Wrap

`.wa-flex-wrap` `.wa-flex-nowrap` `.wa-flex-wrap-reverse`

## Grid Helpers

`.wa-span-grid` -- Apply to a child to span all grid columns.

## Custom Properties

| Property | Applies To | Default | Purpose |
|----------|-----------|---------|---------|
| `--min-column-size` | `.wa-grid` | `20ch` | Min column width before wrapping |
| `--flank-size` | `.wa-flank` | auto | Target width of the flanking element |
| `--content-percentage` | `.wa-flank` | `50%` | Min main content width before wrap |

## Variants

**Flank:** `.wa-flank:start` (default, first child flanks) `.wa-flank:end` (last child flanks)

**Split:** `.wa-split:row` (default, horizontal) `.wa-split:column` (vertical)

**Frame:** `.wa-frame:square` (1:1, default) `.wa-frame:landscape` (16:9) `.wa-frame:portrait` (9:16)

## Other Utilities

### Dark Sections with `.wa-dark`

`.wa-dark` applies the dark color scheme to a subtree, auto-inverting all `--wa-color-*` tokens. Use it for:
- Hero sections with dark backgrounds
- CTA banners
- Footer sections
- Feature highlights

```tsx
{/* React */}
<section className="wa-dark" style={{ padding: 'var(--wa-space-2xl) var(--wa-space-l)' }}>
  {/* All tokens auto-invert: text becomes light, surfaces become dark */}
  <div className="wa-stack wa-gap-m wa-align-items-center" style={{ textAlign: 'center' }}>
    <h2>Ready to get started?</h2>
    <p style={{ color: 'var(--wa-color-text-quiet)' }}>
      Join thousands of developers building with Kigumi.
    </p>
    <Button variant="brand" size="large">Get Started</Button>
  </div>
</section>
```

```vue
<!-- Vue -->
<section class="wa-dark" style="padding: var(--wa-space-2xl) var(--wa-space-l)">
  <div class="wa-stack wa-gap-m wa-align-items-center" style="text-align: center">
    <h2>Ready to get started?</h2>
    <p style="color: var(--wa-color-text-quiet)">
      Join thousands of developers building with Kigumi.
    </p>
    <Button variant="brand" size="large">Get Started</Button>
  </div>
</section>
```

**How it works:** `.wa-dark` redefines all `--wa-color-*` custom properties in the subtree. Surface colors become dark, text colors become light, and brand/accent colors adjust for contrast on dark backgrounds. No additional CSS needed.

**Nesting:** `.wa-dark` sections can be nested inside light pages. You can also use it on individual components:

```tsx
<Card className="wa-dark">
  {/* This card has dark styling, rest of page stays light */}
</Card>
```

`.wa-border-radius-s` `.wa-border-radius-m` `.wa-border-radius-l` `.wa-border-radius-pill` `.wa-border-radius-circle` `.wa-border-radius-square`

## Typography Utilities

Use these instead of inline styles for text:

**Headings:** `wa-heading-2xs` `wa-heading-xs` `wa-heading-s` `wa-heading-m` `wa-heading-l` `wa-heading-xl` `wa-heading-2xl` `wa-heading-3xl` `wa-heading-4xl`

**Body:** `wa-body-2xs` `wa-body-xs` `wa-body-s` `wa-body-m` `wa-body-l` `wa-body-xl` `wa-body-2xl`

**Captions:** `wa-caption-2xs` `wa-caption-xs` `wa-caption-s` `wa-caption-m` `wa-caption-l` `wa-caption-xl`

**Font sizes:** `wa-font-size-2xs` through `wa-font-size-4xl`
**Font weights:** `wa-font-weight-light` `wa-font-weight-normal` `wa-font-weight-semibold` `wa-font-weight-bold`
**Text colors:** `wa-color-text-quiet` `wa-color-text-normal` `wa-color-text-link`
**Truncation:** `wa-text-truncate`
**Links:** `wa-link` (styled link), `wa-link-plain` (no underline), `wa-list-plain` (unstyled list)

## Color Variant Utilities

Apply semantic color scoping to elements:

`.wa-brand` `.wa-neutral` `.wa-success` `.wa-warning` `.wa-danger`

These define generic color tokens for the subtree: `--wa-color-fill-quiet`, `--wa-color-border-quiet`, `--wa-color-on-quiet`.

## Native Element Utilities

**Tables:** `wa-zebra-rows` (alternating row colors), `wa-hover-rows` (highlight on hover)
**Buttons:** `wa-button` (make `<a>` look like button), `wa-accent` `wa-filled` `wa-outlined` `wa-plain` (appearances), `wa-size-s` `wa-size-m` `wa-size-l` (sizes), `wa-pill` (rounded)
**Accessibility:** `wa-visually-hidden` (screen-reader only), `wa-visually-hidden-label`, `wa-visually-hidden-hint`, `wa-visually-hidden-force`
**FOUCE:** `wa-cloak` (hide until custom elements register)

## Decision Matrix

| I want to... | Use |
|---|---|
| Stack items vertically | `.wa-stack` |
| Create a responsive card grid | `.wa-grid` + `--min-column-size` |
| Wrap items horizontally (tags, buttons) | `.wa-cluster` |
| Create sidebar + content layout | `.wa-flank` + `--flank-size` |
| Constrain an image to aspect ratio | `.wa-frame` + variant |
| Push items to opposite ends | `.wa-split` |
| Add space between items | `.wa-gap-{size}` |
| Center items | `.wa-align-items-center` + `.wa-justify-content-center` |

## Custom CSS with WA Design Tokens

When building custom layouts (timelines, steppers, hero sections) that need raw CSS Grid/Flexbox, consume WA design tokens for colors, spacing, and typography to stay consistent with the design system.

### Token Categories for Custom CSS

| Need | Token Pattern | Example |
|------|--------------|---------|
| Colors | `var(--wa-color-*)` | `var(--wa-color-brand)`, `var(--wa-color-surface-border)` |
| Spacing | `var(--wa-space-*)` | `var(--wa-space-m)`, `var(--wa-space-xl)` |
| Typography | `var(--wa-font-size-*)`, `var(--wa-font-weight-*)` | `var(--wa-font-size-l)` |
| Radii | `var(--wa-border-radius-*)` | `var(--wa-border-radius-m)` |
| Shadows | `var(--wa-shadow-*)` | `var(--wa-shadow-m)` |
| Transitions | `var(--wa-transition-*)` | `var(--wa-transition-fast)` |

### Example: Custom Timeline

A vertical timeline using CSS Grid with WA tokens for consistent theming:

```tsx
const timelineStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 2px 1fr',
  gap: 'var(--wa-space-m)',
};

const railStyle: React.CSSProperties = {
  backgroundColor: 'var(--wa-color-surface-border)',
  borderRadius: 'var(--wa-border-radius-pill)',
};

const nodeStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: 'var(--wa-color-brand)',
  border: '2px solid var(--wa-color-surface-raised)',
  alignSelf: 'start',
  marginTop: 'var(--wa-space-xs)',
};

export function Timeline({ items }: { items: { title: string; date: string; description: string }[] }) {
  return (
    <div style={timelineStyles}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <div style={nodeStyle} />
          <div style={i < items.length - 1 ? railStyle : { ...railStyle, visibility: 'hidden' }} />
          <div className="wa-stack wa-gap-2xs" style={{ paddingBottom: 'var(--wa-space-l)' }}>
            <strong>{item.title}</strong>
            <small style={{ color: 'var(--wa-color-text-quiet)' }}>{item.date}</small>
            <p>{item.description}</p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
```

**Key principle:** Use WA layout utilities (`.wa-stack`, `.wa-grid`, etc.) wherever they fit. Only drop to custom CSS when the layout primitive doesn't exist (e.g., timelines, steppers, custom grids with fixed track sizing). Always use `var(--wa-*)` tokens instead of hardcoded values for colors, spacing, and typography.
