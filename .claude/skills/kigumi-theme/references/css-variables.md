# CSS Variables Reference

Complete reference of CSS custom properties (design tokens) defined in Web Awesome themes. All values sourced from `default.css` in Web Awesome 3.4.0.

## Naming Convention

All tokens use the `--wa-` prefix:

```
--wa-{category}-{property}-{modifier}
```

Examples:

- `--wa-color-surface-raised` -- Elevated surface color
- `--wa-space-m` -- Medium spacing (16px)
- `--wa-border-radius-l` -- Large border radius

## 1. Surface Colors

Background and container colors. Mode-dependent (change between light and dark).

| Variable                     | Light Default                | Dark Default                                                      | Description                           |
| ---------------------------- | ---------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| `--wa-color-surface-raised`  | `white`                      | `var(--wa-color-neutral-10)`                                      | Elevated surface (cards, popovers)    |
| `--wa-color-surface-default` | `white`                      | `var(--wa-color-neutral-05)`                                      | Default page background               |
| `--wa-color-surface-lowered` | `var(--wa-color-neutral-95)` | `color-mix(in oklab, var(--wa-color-surface-default), black 20%)` | Recessed surface (code blocks, wells) |
| `--wa-color-surface-border`  | `var(--wa-color-neutral-90)` | `var(--wa-color-neutral-20)`                                      | Border color for surface elements     |

## 2. Text Colors

Mode-dependent text colors.

| Variable                 | Light Default                | Dark Default                 | Description          |
| ------------------------ | ---------------------------- | ---------------------------- | -------------------- |
| `--wa-color-text-normal` | `var(--wa-color-neutral-10)` | `var(--wa-color-neutral-95)` | Primary text color   |
| `--wa-color-text-quiet`  | `var(--wa-color-neutral-40)` | `var(--wa-color-neutral-60)` | Secondary/muted text |
| `--wa-color-text-link`   | `var(--wa-color-brand-40)`   | `var(--wa-color-brand-70)`   | Link text color      |

## 3. Variant Colors (Semantic Color System)

5 variants, each with 3 properties at 3 intensities = 45 tokens. All mode-dependent.

Pattern: `--wa-color-{variant}-{property}-{intensity}`

- **Variants**: `brand`, `success`, `warning`, `danger`, `neutral`
- **Properties**: `fill` (background), `border` (stroke), `on` (text/icon on that variant)
- **Intensities**: `quiet` (subtle), `normal` (default), `loud` (saturated/prominent)

### Brand

| Variable                         | Light Default              | Dark Default               | Description                    |
| -------------------------------- | -------------------------- | -------------------------- | ------------------------------ |
| `--wa-color-brand-fill-quiet`    | `var(--wa-color-brand-95)` | `var(--wa-color-brand-10)` | Subtle brand background        |
| `--wa-color-brand-fill-normal`   | `var(--wa-color-brand-90)` | `var(--wa-color-brand-20)` | Default brand background       |
| `--wa-color-brand-fill-loud`     | `var(--wa-color-brand-50)` | `var(--wa-color-brand-50)` | Saturated brand fill (buttons) |
| `--wa-color-brand-border-quiet`  | `var(--wa-color-brand-90)` | `var(--wa-color-brand-20)` | Subtle brand border            |
| `--wa-color-brand-border-normal` | `var(--wa-color-brand-80)` | `var(--wa-color-brand-30)` | Default brand border           |
| `--wa-color-brand-border-loud`   | `var(--wa-color-brand-60)` | `var(--wa-color-brand-40)` | Strong brand border            |
| `--wa-color-brand-on-quiet`      | `var(--wa-color-brand-40)` | `var(--wa-color-brand-60)` | Subtle brand text              |
| `--wa-color-brand-on-normal`     | `var(--wa-color-brand-30)` | `var(--wa-color-brand-70)` | Default brand text             |
| `--wa-color-brand-on-loud`       | `white`                    | `white`                    | Text on loud brand fill        |

### Success

| Variable                           | Light Default                | Dark Default                 | Description                |
| ---------------------------------- | ---------------------------- | ---------------------------- | -------------------------- |
| `--wa-color-success-fill-quiet`    | `var(--wa-color-success-95)` | `var(--wa-color-success-10)` | Subtle success background  |
| `--wa-color-success-fill-normal`   | `var(--wa-color-success-90)` | `var(--wa-color-success-20)` | Default success background |
| `--wa-color-success-fill-loud`     | `var(--wa-color-success-50)` | `var(--wa-color-success-50)` | Saturated success fill     |
| `--wa-color-success-border-quiet`  | `var(--wa-color-success-90)` | `var(--wa-color-success-20)` | Subtle success border      |
| `--wa-color-success-border-normal` | `var(--wa-color-success-80)` | `var(--wa-color-success-30)` | Default success border     |
| `--wa-color-success-border-loud`   | `var(--wa-color-success-60)` | `var(--wa-color-success-40)` | Strong success border      |
| `--wa-color-success-on-quiet`      | `var(--wa-color-success-40)` | `var(--wa-color-success-60)` | Subtle success text        |
| `--wa-color-success-on-normal`     | `var(--wa-color-success-30)` | `var(--wa-color-success-70)` | Default success text       |
| `--wa-color-success-on-loud`       | `white`                      | `white`                      | Text on loud success fill  |

### Warning

| Variable                           | Light Default                | Dark Default                 | Description                |
| ---------------------------------- | ---------------------------- | ---------------------------- | -------------------------- |
| `--wa-color-warning-fill-quiet`    | `var(--wa-color-warning-95)` | `var(--wa-color-warning-10)` | Subtle warning background  |
| `--wa-color-warning-fill-normal`   | `var(--wa-color-warning-90)` | `var(--wa-color-warning-20)` | Default warning background |
| `--wa-color-warning-fill-loud`     | `var(--wa-color-warning-50)` | `var(--wa-color-warning-50)` | Saturated warning fill     |
| `--wa-color-warning-border-quiet`  | `var(--wa-color-warning-90)` | `var(--wa-color-warning-20)` | Subtle warning border      |
| `--wa-color-warning-border-normal` | `var(--wa-color-warning-80)` | `var(--wa-color-warning-30)` | Default warning border     |
| `--wa-color-warning-border-loud`   | `var(--wa-color-warning-60)` | `var(--wa-color-warning-40)` | Strong warning border      |
| `--wa-color-warning-on-quiet`      | `var(--wa-color-warning-40)` | `var(--wa-color-warning-60)` | Subtle warning text        |
| `--wa-color-warning-on-normal`     | `var(--wa-color-warning-30)` | `var(--wa-color-warning-70)` | Default warning text       |
| `--wa-color-warning-on-loud`       | `white`                      | `white`                      | Text on loud warning fill  |

### Danger

| Variable                          | Light Default               | Dark Default                | Description               |
| --------------------------------- | --------------------------- | --------------------------- | ------------------------- |
| `--wa-color-danger-fill-quiet`    | `var(--wa-color-danger-95)` | `var(--wa-color-danger-10)` | Subtle danger background  |
| `--wa-color-danger-fill-normal`   | `var(--wa-color-danger-90)` | `var(--wa-color-danger-20)` | Default danger background |
| `--wa-color-danger-fill-loud`     | `var(--wa-color-danger-50)` | `var(--wa-color-danger-50)` | Saturated danger fill     |
| `--wa-color-danger-border-quiet`  | `var(--wa-color-danger-90)` | `var(--wa-color-danger-20)` | Subtle danger border      |
| `--wa-color-danger-border-normal` | `var(--wa-color-danger-80)` | `var(--wa-color-danger-30)` | Default danger border     |
| `--wa-color-danger-border-loud`   | `var(--wa-color-danger-60)` | `var(--wa-color-danger-40)` | Strong danger border      |
| `--wa-color-danger-on-quiet`      | `var(--wa-color-danger-40)` | `var(--wa-color-danger-60)` | Subtle danger text        |
| `--wa-color-danger-on-normal`     | `var(--wa-color-danger-30)` | `var(--wa-color-danger-70)` | Default danger text       |
| `--wa-color-danger-on-loud`       | `white`                     | `white`                     | Text on loud danger fill  |

### Neutral

| Variable                           | Light Default                | Dark Default                 | Description                |
| ---------------------------------- | ---------------------------- | ---------------------------- | -------------------------- |
| `--wa-color-neutral-fill-quiet`    | `var(--wa-color-neutral-95)` | `var(--wa-color-neutral-10)` | Subtle neutral background  |
| `--wa-color-neutral-fill-normal`   | `var(--wa-color-neutral-90)` | `var(--wa-color-neutral-20)` | Default neutral background |
| `--wa-color-neutral-fill-loud`     | `var(--wa-color-neutral-20)` | `var(--wa-color-neutral-90)` | Saturated neutral fill     |
| `--wa-color-neutral-border-quiet`  | `var(--wa-color-neutral-90)` | `var(--wa-color-neutral-20)` | Subtle neutral border      |
| `--wa-color-neutral-border-normal` | `var(--wa-color-neutral-80)` | `var(--wa-color-neutral-30)` | Default neutral border     |
| `--wa-color-neutral-border-loud`   | `var(--wa-color-neutral-60)` | `var(--wa-color-neutral-40)` | Strong neutral border      |
| `--wa-color-neutral-on-quiet`      | `var(--wa-color-neutral-40)` | `var(--wa-color-neutral-60)` | Subtle neutral text        |
| `--wa-color-neutral-on-normal`     | `var(--wa-color-neutral-30)` | `var(--wa-color-neutral-70)` | Default neutral text       |
| `--wa-color-neutral-on-loud`       | `white`                      | `var(--wa-color-neutral-05)` | Text on loud neutral fill  |

## 4. Utility Colors

| Variable                    | Light Default                                                            | Dark Default                                                                  | Description                             |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------- |
| `--wa-color-shadow`         | `color-mix(in oklab, var(--wa-color-neutral-05) calc(...), transparent)` | `color-mix(in oklab, var(--wa-color-surface-lowered) calc(...), transparent)` | Shadow color (computed from blur scale) |
| `--wa-color-focus`          | `var(--wa-color-brand-60)`                                               | `var(--wa-color-brand-60)`                                                    | Focus ring color                        |
| `--wa-color-overlay-modal`  | `color-mix(in oklab, var(--wa-color-neutral-05) 50%, transparent)`       | `color-mix(in oklab, black 60%, transparent)`                                 | Modal backdrop overlay                  |
| `--wa-color-overlay-inline` | `color-mix(in oklab, var(--wa-color-neutral-80) 25%, transparent)`       | `color-mix(in oklab, var(--wa-color-neutral-50) 10%, transparent)`            | Inline overlay (skeleton, loading)      |
| `--wa-color-mix-hover`      | `black 10%`                                                              | `black 8%`                                                                    | Hover state color-mix value             |
| `--wa-color-mix-active`     | `black 20%`                                                              | `black 16%`                                                                   | Active/pressed state color-mix value    |

> **Note:** `--wa-color-mix-hover` and `--wa-color-mix-active` are used inside `color-mix()` functions, not as standalone colors. Example: `color-mix(in oklab, var(--wa-color-brand-fill-loud), var(--wa-color-mix-hover))`.

## 5. Font Families

| Variable                    | Default                                | Description                             |
| --------------------------- | -------------------------------------- | --------------------------------------- |
| `--wa-font-family-body`     | `ui-sans-serif, system-ui, sans-serif` | Default body text font                  |
| `--wa-font-family-heading`  | `var(--wa-font-family-body)`           | Heading font (inherits body by default) |
| `--wa-font-family-code`     | `ui-monospace, monospace`              | Monospace font for code                 |
| `--wa-font-family-longform` | `ui-serif, serif`                      | Serif font for long-form content        |

## 6. Font Sizes

Uses a 1.125 ratio to scale proportionally. The `--wa-font-size-scale` multiplier cascades to all sizes.

| Variable                 | Default                                                     | Approx px | Description                 |
| ------------------------ | ----------------------------------------------------------- | --------- | --------------------------- |
| `--wa-font-size-scale`   | `1`                                                         | --        | Global font size multiplier |
| `--wa-font-size-3xs`     | `round(calc(var(--wa-font-size-2xs) / 1.125), 1px)`         | 10px      | Smallest text               |
| `--wa-font-size-2xs`     | `round(calc(var(--wa-font-size-xs) / 1.125), 1px)`          | 11px      | Extra extra small           |
| `--wa-font-size-xs`      | `round(calc(var(--wa-font-size-s) / 1.125), 1px)`           | 12px      | Extra small                 |
| `--wa-font-size-s`       | `round(calc(var(--wa-font-size-m) / 1.125), 1px)`           | 14px      | Small                       |
| `--wa-font-size-m`       | `calc(1rem * var(--wa-font-size-scale))`                    | 16px      | Medium (base)               |
| `--wa-font-size-l`       | `round(calc(var(--wa-font-size-m) * 1.125 * 1.125), 1px)`   | 20px      | Large                       |
| `--wa-font-size-xl`      | `round(calc(var(--wa-font-size-l) * 1.125 * 1.125), 1px)`   | 25px      | Extra large                 |
| `--wa-font-size-2xl`     | `round(calc(var(--wa-font-size-xl) * 1.125 * 1.125), 1px)`  | 32px      | 2x large                    |
| `--wa-font-size-3xl`     | `round(calc(var(--wa-font-size-2xl) * 1.125 * 1.125), 1px)` | 41px      | 3x large                    |
| `--wa-font-size-4xl`     | `round(calc(var(--wa-font-size-3xl) * 1.125 * 1.125), 1px)` | 52px      | 4x large                    |
| `--wa-font-size-5xl`     | `round(calc(var(--wa-font-size-4xl) * 1.125 * 1.125), 1px)` | 66px      | 5x large                    |
| `--wa-font-size-smaller` | `round(calc(1em / 1.125), 1px)`                             | --        | Relative: one step smaller  |
| `--wa-font-size-larger`  | `round(calc(1em * 1.125 * 1.125), 1px)`                     | --        | Relative: one step larger   |

## 7. Font Weights

### Base Weights

| Variable                    | Default | Description     |
| --------------------------- | ------- | --------------- |
| `--wa-font-weight-light`    | `300`   | Light weight    |
| `--wa-font-weight-normal`   | `400`   | Normal weight   |
| `--wa-font-weight-semibold` | `500`   | Semibold weight |
| `--wa-font-weight-bold`     | `600`   | Bold weight     |

### Purpose Aliases

These map to base weights by default but can be overridden independently.

| Variable                    | Default                          | Description              |
| --------------------------- | -------------------------------- | ------------------------ |
| `--wa-font-weight-body`     | `var(--wa-font-weight-normal)`   | Body text weight         |
| `--wa-font-weight-heading`  | `var(--wa-font-weight-bold)`     | Heading weight           |
| `--wa-font-weight-code`     | `var(--wa-font-weight-normal)`   | Code text weight         |
| `--wa-font-weight-longform` | `var(--wa-font-weight-normal)`   | Long-form content weight |
| `--wa-font-weight-action`   | `var(--wa-font-weight-semibold)` | Button/action weight     |

## 8. Line Heights

| Variable                     | Default | Description                        |
| ---------------------------- | ------- | ---------------------------------- |
| `--wa-line-height-condensed` | `1.2`   | Tight line height (headings)       |
| `--wa-line-height-normal`    | `1.6`   | Normal line height (body text)     |
| `--wa-line-height-expanded`  | `2`     | Spacious line height (readability) |

## 9. Space

All spacing values multiply against `--wa-space-scale`. Change the scale to adjust all spacing proportionally.

| Variable               | Default                                  | Approx px | Description               |
| ---------------------- | ---------------------------------------- | --------- | ------------------------- |
| `--wa-space-scale`     | `1`                                      | --        | Global spacing multiplier |
| `--wa-space-3xs`       | `calc(var(--wa-space-scale) * 0.125rem)` | 2px       | Tiniest gap               |
| `--wa-space-2xs`       | `calc(var(--wa-space-scale) * 0.25rem)`  | 4px       | Very small gap            |
| `--wa-space-xs`        | `calc(var(--wa-space-scale) * 0.5rem)`   | 8px       | Extra small               |
| `--wa-space-s`         | `calc(var(--wa-space-scale) * 0.75rem)`  | 12px      | Small                     |
| `--wa-space-m`         | `calc(var(--wa-space-scale) * 1rem)`     | 16px      | Medium (base)             |
| `--wa-space-l`         | `calc(var(--wa-space-scale) * 1.5rem)`   | 24px      | Large                     |
| `--wa-space-xl`        | `calc(var(--wa-space-scale) * 2rem)`     | 32px      | Extra large               |
| `--wa-space-2xl`       | `calc(var(--wa-space-scale) * 2.5rem)`   | 40px      | 2x large                  |
| `--wa-space-3xl`       | `calc(var(--wa-space-scale) * 3rem)`     | 48px      | 3x large                  |
| `--wa-space-4xl`       | `calc(var(--wa-space-scale) * 4rem)`     | 64px      | 4x large                  |
| `--wa-space-5xl`       | `calc(var(--wa-space-scale) * 5rem)`     | 80px      | 5x large                  |
| `--wa-content-spacing` | `var(--wa-space-l)`                      | 24px      | Default content gap       |

## 10. Borders

### Border Style and Width

| Variable                  | Default                                          | Description                    |
| ------------------------- | ------------------------------------------------ | ------------------------------ |
| `--wa-border-style`       | `solid`                                          | Default border line style      |
| `--wa-border-width-scale` | `1`                                              | Global border width multiplier |
| `--wa-border-width-s`     | `calc(var(--wa-border-width-scale) * 0.0625rem)` | Small width (1px)              |
| `--wa-border-width-m`     | `calc(var(--wa-border-width-scale) * 0.125rem)`  | Medium width (2px)             |
| `--wa-border-width-l`     | `calc(var(--wa-border-width-scale) * 0.1875rem)` | Large width (3px)              |

### Border Radius

| Variable                    | Default                                           | Description                     |
| --------------------------- | ------------------------------------------------- | ------------------------------- |
| `--wa-border-radius-scale`  | `1`                                               | Global border radius multiplier |
| `--wa-border-radius-s`      | `calc(var(--wa-border-radius-scale) * 0.1875rem)` | Small radius (3px)              |
| `--wa-border-radius-m`      | `calc(var(--wa-border-radius-scale) * 0.375rem)`  | Medium radius (6px)             |
| `--wa-border-radius-l`      | `calc(var(--wa-border-radius-scale) * 0.75rem)`   | Large radius (12px)             |
| `--wa-border-radius-pill`   | `9999px`                                          | Pill shape (fully rounded)      |
| `--wa-border-radius-circle` | `50%`                                             | Circle shape                    |
| `--wa-border-radius-square` | `0px`                                             | Square corners (no rounding)    |

## 11. Shadows

Shadows are decomposed into individual axis tokens, each controlled by a scale multiplier. This allows fine-grained tuning of shadow direction, softness, and spread.

### Scale Tokens

| Variable                     | Default | Description                            |
| ---------------------------- | ------- | -------------------------------------- |
| `--wa-shadow-offset-x-scale` | `0`     | Horizontal offset multiplier           |
| `--wa-shadow-offset-y-scale` | `1`     | Vertical offset multiplier             |
| `--wa-shadow-blur-scale`     | `1`     | Blur radius multiplier                 |
| `--wa-shadow-spread-scale`   | `-0.5`  | Spread multiplier (negative = tighter) |

### Decomposed Values

| Variable                 | Default                                            | Description              |
| ------------------------ | -------------------------------------------------- | ------------------------ |
| `--wa-shadow-offset-x-s` | `calc(var(--wa-shadow-offset-x-scale) * 0.125rem)` | Small horizontal offset  |
| `--wa-shadow-offset-x-m` | `calc(var(--wa-shadow-offset-x-scale) * 0.25rem)`  | Medium horizontal offset |
| `--wa-shadow-offset-x-l` | `calc(var(--wa-shadow-offset-x-scale) * 0.5rem)`   | Large horizontal offset  |
| `--wa-shadow-offset-y-s` | `calc(var(--wa-shadow-offset-y-scale) * 0.125rem)` | Small vertical offset    |
| `--wa-shadow-offset-y-m` | `calc(var(--wa-shadow-offset-y-scale) * 0.25rem)`  | Medium vertical offset   |
| `--wa-shadow-offset-y-l` | `calc(var(--wa-shadow-offset-y-scale) * 0.5rem)`   | Large vertical offset    |
| `--wa-shadow-blur-s`     | `calc(var(--wa-shadow-blur-scale) * 0.125rem)`     | Small blur radius        |
| `--wa-shadow-blur-m`     | `calc(var(--wa-shadow-blur-scale) * 0.25rem)`      | Medium blur radius       |
| `--wa-shadow-blur-l`     | `calc(var(--wa-shadow-blur-scale) * 0.5rem)`       | Large blur radius        |
| `--wa-shadow-spread-s`   | `calc(var(--wa-shadow-spread-scale) * 0.125rem)`   | Small spread             |
| `--wa-shadow-spread-m`   | `calc(var(--wa-shadow-spread-scale) * 0.25rem)`    | Medium spread            |
| `--wa-shadow-spread-l`   | `calc(var(--wa-shadow-spread-scale) * 0.5rem)`     | Large spread             |

### Composite Shadows

| Variable        | Default                                                                                                                            | Description   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `--wa-shadow-s` | `var(--wa-shadow-offset-x-s) var(--wa-shadow-offset-y-s) var(--wa-shadow-blur-s) var(--wa-shadow-spread-s) var(--wa-color-shadow)` | Small shadow  |
| `--wa-shadow-m` | `var(--wa-shadow-offset-x-m) var(--wa-shadow-offset-y-m) var(--wa-shadow-blur-m) var(--wa-shadow-spread-m) var(--wa-color-shadow)` | Medium shadow |
| `--wa-shadow-l` | `var(--wa-shadow-offset-x-l) var(--wa-shadow-offset-y-l) var(--wa-shadow-blur-l) var(--wa-shadow-spread-l) var(--wa-color-shadow)` | Large shadow  |

## 12. Focus Ring

| Variable                 | Default                                                                       | Description                  |
| ------------------------ | ----------------------------------------------------------------------------- | ---------------------------- |
| `--wa-focus-ring-style`  | `solid`                                                                       | Focus ring outline style     |
| `--wa-focus-ring-width`  | `0.1875rem` (3px)                                                             | Focus ring thickness         |
| `--wa-focus-ring-offset` | `0.0625rem` (1px)                                                             | Gap between element and ring |
| `--wa-focus-ring`        | `var(--wa-focus-ring-style) var(--wa-focus-ring-width) var(--wa-color-focus)` | Shorthand outline value      |

## 13. Transitions

| Variable                 | Default | Description                          |
| ------------------------ | ------- | ------------------------------------ |
| `--wa-transition-fast`   | `75ms`  | Fast transition (micro-interactions) |
| `--wa-transition-normal` | `150ms` | Normal transition (standard UI)      |
| `--wa-transition-slow`   | `300ms` | Slow transition (page-level changes) |
| `--wa-transition-easing` | `ease`  | Default easing function              |

## 14. Form Controls

Tokens that style all form elements (inputs, selects, textareas, checkboxes, switches, etc.).

| Variable                                    | Default                                                                                                       | Description                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `--wa-form-control-background-color`        | `var(--wa-color-surface-default)`                                                                             | Input background                |
| `--wa-form-control-border-color`            | `var(--wa-color-neutral-border-loud)`                                                                         | Input border color              |
| `--wa-form-control-border-style`            | `var(--wa-border-style)`                                                                                      | Input border style              |
| `--wa-form-control-border-width`            | `var(--wa-border-width-s)`                                                                                    | Input border width              |
| `--wa-form-control-border-radius`           | `var(--wa-border-radius-m)`                                                                                   | Input border radius             |
| `--wa-form-control-activated-color`         | `var(--wa-color-brand-fill-loud)`                                                                             | Color for checked/toggled state |
| `--wa-form-control-label-color`             | `var(--wa-color-text-normal)`                                                                                 | Label text color                |
| `--wa-form-control-label-font-weight`       | `var(--wa-font-weight-semibold)`                                                                              | Label font weight               |
| `--wa-form-control-label-line-height`       | `var(--wa-line-height-condensed)`                                                                             | Label line height               |
| `--wa-form-control-value-color`             | `var(--wa-color-text-normal)`                                                                                 | Input value text color          |
| `--wa-form-control-value-font-weight`       | `var(--wa-font-weight-body)`                                                                                  | Input value font weight         |
| `--wa-form-control-value-line-height`       | `var(--wa-line-height-condensed)`                                                                             | Input value line height         |
| `--wa-form-control-hint-color`              | `var(--wa-color-text-quiet)`                                                                                  | Help text color                 |
| `--wa-form-control-hint-font-weight`        | `var(--wa-font-weight-body)`                                                                                  | Help text font weight           |
| `--wa-form-control-hint-line-height`        | `var(--wa-line-height-normal)`                                                                                | Help text line height           |
| `--wa-form-control-placeholder-color`       | `var(--wa-color-gray-50)`                                                                                     | Placeholder text color          |
| `--wa-form-control-required-content`        | `'*'`                                                                                                         | Required field indicator        |
| `--wa-form-control-required-content-color`  | `inherit`                                                                                                     | Required indicator color        |
| `--wa-form-control-required-content-offset` | `0.1em`                                                                                                       | Required indicator spacing      |
| `--wa-form-control-padding-block`           | `0.75em`                                                                                                      | Vertical padding                |
| `--wa-form-control-padding-inline`          | `1em`                                                                                                         | Horizontal padding              |
| `--wa-form-control-height`                  | `round(calc(2 * var(--wa-form-control-padding-block) + 1em * var(--wa-form-control-value-line-height)), 1px)` | Computed input height           |
| `--wa-form-control-toggle-size`             | `round(1.25em, 1px)`                                                                                          | Checkbox/switch size            |

## 15. Panels

| Variable                   | Default                     | Description         |
| -------------------------- | --------------------------- | ------------------- |
| `--wa-panel-border-style`  | `var(--wa-border-style)`    | Panel border style  |
| `--wa-panel-border-width`  | `var(--wa-border-width-s)`  | Panel border width  |
| `--wa-panel-border-radius` | `var(--wa-border-radius-l)` | Panel border radius |

## 16. Tooltips

| Variable                        | Default                              | Description           |
| ------------------------------- | ------------------------------------ | --------------------- |
| `--wa-tooltip-arrow-size`       | `0.375rem` (6px)                     | Tooltip arrow size    |
| `--wa-tooltip-background-color` | `var(--wa-color-text-normal)`        | Tooltip background    |
| `--wa-tooltip-border-color`     | `var(--wa-tooltip-background-color)` | Tooltip border color  |
| `--wa-tooltip-border-style`     | `var(--wa-border-style)`             | Tooltip border style  |
| `--wa-tooltip-border-width`     | `var(--wa-border-width-s)`           | Tooltip border width  |
| `--wa-tooltip-border-radius`    | `var(--wa-border-radius-s)`          | Tooltip border radius |
| `--wa-tooltip-content-color`    | `var(--wa-color-surface-default)`    | Tooltip text color    |
| `--wa-tooltip-font-size`        | `var(--wa-font-size-s)`              | Tooltip font size     |
| `--wa-tooltip-line-height`      | `var(--wa-line-height-normal)`       | Tooltip line height   |

## 17. Link Decoration

| Variable                       | Default                                                               | Description             |
| ------------------------------ | --------------------------------------------------------------------- | ----------------------- |
| `--wa-link-decoration-default` | `underline color-mix(in oklab, currentColor 70%, transparent) dotted` | Default link underline  |
| `--wa-link-decoration-hover`   | `underline`                                                           | Link underline on hover |

## Best Practices

- Override variables at `:root` scope for global changes, or inside `.wa-dark` for dark-mode-only adjustments
- Use `@layer wa-theme-overrides` for your custom CSS to respect the cascade layer ordering
- Prefer scale tokens (`--wa-space-scale`, `--wa-border-radius-scale`, etc.) for proportional changes
- Use `::part()` selectors to style individual component internals
- Never use `!important` -- adjust cascade layer ordering instead
- Test overrides in both light mode and `.wa-dark` mode

## Inspecting Variables

Use browser DevTools to inspect active CSS variables:

1. Right-click an element and select Inspect
2. In the Computed tab, scroll to see all CSS variables
3. Filter by `--wa-` to see theme tokens
4. Toggle `.wa-dark` on `<html>` to check dark mode values

---

**Source:** Web Awesome 3.4.0 `dist/styles/themes/default.css`
**Documentation:** [kigumi.style](https://kigumi.style) | [webawesome.com/docs/theming](https://webawesome.com/docs/theming)
