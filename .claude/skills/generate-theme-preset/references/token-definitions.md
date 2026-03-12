# Studio Token System (43 Properties)

Kigumi Studio supports 43 Web Awesome design tokens organized in 15 groups. These are the ONLY tokens editable in the Studio UI.

## Colors - Brand (1 property)

| CSS Variable       | Default (Light) | Default (Dark) | Input | Range | Description                              |
| ------------------ | --------------- | -------------- | ----- | ----- | ---------------------------------------- |
| `--wa-color-brand` | `#0071ec`       | `#0071ec`      | color | -     | Primary brand color (NOT mode-dependent) |

## Colors - Surface (4 properties)

| CSS Variable                 | Default (Light) | Default (Dark) | Input | Description                         |
| ---------------------------- | --------------- | -------------- | ----- | ----------------------------------- |
| `--wa-color-surface-raised`  | `#ffffff`       | `#1b1d26`      | color | Elevated surfaces (cards, popovers) |
| `--wa-color-surface-default` | `#ffffff`       | `#101219`      | color | Default page background             |
| `--wa-color-surface-lowered` | `#f1f2f3`       | `#0a0b10`      | color | Recessed surfaces (code blocks)     |
| `--wa-color-surface-border`  | `#e4e5e9`       | `#2f323f`      | color | Border color for surfaces           |

**Hierarchy Rule:** raised (lightest) > default > lowered (darkest) in light mode, INVERTED in dark mode.

## Colors - Text (3 properties)

| CSS Variable             | Default (Light) | Default (Dark) | Input | Description          |
| ------------------------ | --------------- | -------------- | ----- | -------------------- |
| `--wa-color-text-normal` | `#1b1d26`       | `#f1f2f3`      | color | Primary text color   |
| `--wa-color-text-quiet`  | `#545868`       | `#9194a2`      | color | Secondary/muted text |
| `--wa-color-text-link`   | `#0053c0`       | `#6eb3ff`      | color | Link text color      |

**Contrast Rule:** `text-normal` vs `surface-default` must be >= 4.5:1 (WCAG AA), `text-quiet` >= 3:1.

## Colors - Semantic (4 properties)

| CSS Variable         | Default (Light) | Default (Dark) | Input | Description                            |
| -------------------- | --------------- | -------------- | ----- | -------------------------------------- |
| `--wa-color-success` | `#16a34a`       | `#16a34a`      | color | Base color for success states          |
| `--wa-color-warning` | `#d97706`       | `#d97706`      | color | Base color for warning states          |
| `--wa-color-danger`  | `#dc2626`       | `#dc2626`      | color | Base color for danger/error states     |
| `--wa-color-neutral` | `#6b7280`       | `#6b7280`      | color | Base color for neutral/inactive states |

**Note:** Semantic colors are NOT mode-dependent. Only change if thematically necessary.

## Typography - Families (4 properties)

| CSS Variable                | Default                                | Input  | Options               |
| --------------------------- | -------------------------------------- | ------ | --------------------- |
| `--wa-font-family-body`     | `ui-sans-serif, system-ui, sans-serif` | select | See Bunny Fonts below |
| `--wa-font-family-heading`  | `ui-sans-serif, system-ui, sans-serif` | select | See Bunny Fonts below |
| `--wa-font-family-code`     | `ui-monospace, monospace`              | select | See Bunny Fonts below |
| `--wa-font-family-longform` | `ui-serif, serif`                      | select | See Bunny Fonts below |

**Font Value Format:** `'Font Name', ui-sans-serif, system-ui, sans-serif` (with single quotes around font name).

## Typography - Weights (4 properties)

| CSS Variable                | Default | Input  | Range   |
| --------------------------- | ------- | ------ | ------- |
| `--wa-font-weight-light`    | `300`   | select | 100-900 |
| `--wa-font-weight-normal`   | `400`   | select | 100-900 |
| `--wa-font-weight-semibold` | `500`   | select | 100-900 |
| `--wa-font-weight-bold`     | `700`   | select | 100-900 |

## Typography - Size Scale (1 property)

| CSS Variable           | Default | Input  | Range                | Description                 |
| ---------------------- | ------- | ------ | -------------------- | --------------------------- |
| `--wa-font-size-scale` | `1`     | slider | 0.75-1.5 (step 0.05) | Global font size multiplier |

## Typography - Line Heights (3 properties)

| CSS Variable                 | Default | Input  | Range          | Description     |
| ---------------------------- | ------- | ------ | -------------- | --------------- |
| `--wa-line-height-condensed` | `1.2`   | slider | 1-3 (step 0.1) | For headings    |
| `--wa-line-height-normal`    | `1.6`   | slider | 1-3 (step 0.1) | For body text   |
| `--wa-line-height-expanded`  | `2`     | slider | 1-3 (step 0.1) | For readability |

## Spacing (1 property)

| CSS Variable       | Default | Input  | Range            | Description               |
| ------------------ | ------- | ------ | ---------------- | ------------------------- |
| `--wa-space-scale` | `1`     | slider | 0.5-2 (step 0.1) | Global spacing multiplier |

## Border Radius (1 property)

| CSS Variable               | Default | Input  | Range          | Description                                                      |
| -------------------------- | ------- | ------ | -------------- | ---------------------------------------------------------------- |
| `--wa-border-radius-scale` | `1`     | slider | 0-3 (step 0.1) | Global border radius multiplier (0=sharp, 1=default, 2+=rounded) |

## Border Width & Style (2 properties)

| CSS Variable              | Default | Input  | Options                                            |
| ------------------------- | ------- | ------ | -------------------------------------------------- |
| `--wa-border-width-scale` | `1`     | slider | 0-3 (step 0.1)                                     |
| `--wa-border-style`       | `solid` | select | solid, dashed, dotted, double, groove, ridge, none |

## Shadows (6 properties)

| CSS Variable                 | Default (Light) | Default (Dark) | Input  | Range              | Description                        |
| ---------------------------- | --------------- | -------------- | ------ | ------------------ | ---------------------------------- |
| `--wa-color-shadow`          | `#000000`       | `#000000`      | color  | -                  | Shadow base color (hex)            |
| `--wa-shadow-opacity`        | `0.2`           | `0.5`          | slider | 0-1 (step 0.05)    | Shadow transparency                |
| `--wa-shadow-offset-x-scale` | `0`             | `0`            | slider | -2 to 2 (step 0.1) | Horizontal offset multiplier       |
| `--wa-shadow-offset-y-scale` | `1`             | `1`            | slider | -2 to 2 (step 0.1) | Vertical offset multiplier         |
| `--wa-shadow-blur-scale`     | `1`             | `1`            | slider | 0-5 (step 0.1)     | Blur radius multiplier             |
| `--wa-shadow-spread-scale`   | `-0.5`          | `-0.5`         | slider | -2 to 2 (step 0.1) | Spread multiplier (negative=inset) |

**CRITICAL:** In preset JSON, use `"--wa-color-shadow": "#hex"` and `"--wa-shadow-opacity": "0.x"` as separate properties. The `css-generator.ts` will combine them to `rgb(r g b / opacity)` format on CSS export.

## Form Controls (4 properties)

| CSS Variable                          | Default (Light)          | Default (Dark)           | Input  | Description                 |
| ------------------------------------- | ------------------------ | ------------------------ | ------ | --------------------------- |
| `--wa-form-control-background-color`  | `#ffffff`                | `#101219`                | color  | Input background            |
| `--wa-form-control-border-color`      | `#9194a2`                | `#545868`                | color  | Input border                |
| `--wa-form-control-border-style`      | `var(--wa-border-style)` | `var(--wa-border-style)` | select | inherit or solid/dashed/etc |
| `--wa-form-control-placeholder-color` | `#717584`                | `#717584`                | color  | Placeholder text            |

## Focus Ring (1 property)

| CSS Variable            | Default | Input  | Options                       |
| ----------------------- | ------- | ------ | ----------------------------- |
| `--wa-focus-ring-style` | `solid` | select | solid, dashed, dotted, double |

## Transitions (4 properties)

| CSS Variable             | Default | Input  | Range                                        | Unit |
| ------------------------ | ------- | ------ | -------------------------------------------- | ---- |
| `--wa-transition-fast`   | `75`    | slider | 0-1000 (step 25)                             | ms   |
| `--wa-transition-normal` | `150`   | slider | 0-1000 (step 25)                             | ms   |
| `--wa-transition-slow`   | `300`   | slider | 0-1000 (step 25)                             | ms   |
| `--wa-transition-easing` | `ease`  | select | ease, ease-in, ease-out, ease-in-out, linear |
