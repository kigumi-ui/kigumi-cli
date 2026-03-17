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

`.wa-dark` -- Applies dark color scheme to a subtree.

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
