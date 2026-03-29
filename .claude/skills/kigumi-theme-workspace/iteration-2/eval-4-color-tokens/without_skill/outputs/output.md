# Kigumi Color Tokens Reference

> All color tokens come from Web Awesome (`--wa-` prefix). They are CSS custom properties overridden at `:root` scope in your `src/styles/theme.css`. This document covers every color token available for theming in a Kigumi project.

---

## Architecture Overview

The color system has three layers:

1. **Primitive palette tokens** (`--wa-color-{hue}-{step}`) - Raw color values for 10 hues, 11 steps each
2. **Semantic variant tokens** (`--wa-color-{role}-{step}`) - Role-based aliases (brand, neutral, success, warning, danger) that point into the palette
3. **Contextual tokens** (`--wa-color-{role}-fill-*`, `--wa-color-surface-*`, etc.) - Adaptive tokens that change between light and dark mode

Override order: never touch primitives directly. Override semantic variant tokens or contextual tokens depending on your goal.

---

## Layer 1 — Primitive Color Palette

Defined in `@layer wa-color-palette`. Each hue has steps 05, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95 where lower numbers are darker and higher numbers are lighter. A shorthand `--wa-color-{hue}` points to the "key" step (the most chromatic step in the scale).

### Red

| Token               | Default Hex                  |
| ------------------- | ---------------------------- |
| `--wa-color-red-95` | `#fff0ef`                    |
| `--wa-color-red-90` | `#ffdedc`                    |
| `--wa-color-red-80` | `#ffb8b6`                    |
| `--wa-color-red-70` | `#fd8f90`                    |
| `--wa-color-red-60` | `#f3676c`                    |
| `--wa-color-red-50` | `#dc3146`                    |
| `--wa-color-red-40` | `#b30532`                    |
| `--wa-color-red-30` | `#8a132c`                    |
| `--wa-color-red-20` | `#631323`                    |
| `--wa-color-red-10` | `#3e0913`                    |
| `--wa-color-red-05` | `#2a040b`                    |
| `--wa-color-red`    | alias of `--wa-color-red-50` |

### Orange

| Token                  | Default Hex                     |
| ---------------------- | ------------------------------- |
| `--wa-color-orange-95` | `#fff0e6`                       |
| `--wa-color-orange-90` | `#ffdfca`                       |
| `--wa-color-orange-80` | `#ffbb94`                       |
| `--wa-color-orange-70` | `#ff9266`                       |
| `--wa-color-orange-60` | `#f46a45`                       |
| `--wa-color-orange-50` | `#cd491c`                       |
| `--wa-color-orange-40` | `#9f3501`                       |
| `--wa-color-orange-30` | `#802700`                       |
| `--wa-color-orange-20` | `#601b00`                       |
| `--wa-color-orange-10` | `#3c0d00`                       |
| `--wa-color-orange-05` | `#280600`                       |
| `--wa-color-orange`    | alias of `--wa-color-orange-60` |

### Yellow

| Token                  | Default Hex                     |
| ---------------------- | ------------------------------- |
| `--wa-color-yellow-95` | `#fef3cd`                       |
| `--wa-color-yellow-90` | `#ffe495`                       |
| `--wa-color-yellow-80` | `#fac22b`                       |
| `--wa-color-yellow-70` | `#ef9d00`                       |
| `--wa-color-yellow-60` | `#da7e00`                       |
| `--wa-color-yellow-50` | `#b45f04`                       |
| `--wa-color-yellow-40` | `#8c4602`                       |
| `--wa-color-yellow-30` | `#6f3601`                       |
| `--wa-color-yellow-20` | `#532600`                       |
| `--wa-color-yellow-10` | `#331600`                       |
| `--wa-color-yellow-05` | `#220c00`                       |
| `--wa-color-yellow`    | alias of `--wa-color-yellow-80` |

### Green

| Token                 | Default Hex                    |
| --------------------- | ------------------------------ |
| `--wa-color-green-95` | `#e3f9e3`                      |
| `--wa-color-green-90` | `#c2f2c1`                      |
| `--wa-color-green-80` | `#93da98`                      |
| `--wa-color-green-70` | `#5dc36f`                      |
| `--wa-color-green-60` | `#00ac49`                      |
| `--wa-color-green-50` | `#00883c`                      |
| `--wa-color-green-40` | `#036730`                      |
| `--wa-color-green-30` | `#0a5027`                      |
| `--wa-color-green-20` | `#0a3a1d`                      |
| `--wa-color-green-10` | `#052310`                      |
| `--wa-color-green-05` | `#031608`                      |
| `--wa-color-green`    | alias of `--wa-color-green-60` |

### Cyan

| Token                | Default Hex                   |
| -------------------- | ----------------------------- |
| `--wa-color-cyan-95` | `#e3f6fb`                     |
| `--wa-color-cyan-90` | `#c5ecf7`                     |
| `--wa-color-cyan-80` | `#7fd6ec`                     |
| `--wa-color-cyan-70` | `#2fbedc`                     |
| `--wa-color-cyan-60` | `#00a3c0`                     |
| `--wa-color-cyan-50` | `#078098`                     |
| `--wa-color-cyan-40` | `#026274`                     |
| `--wa-color-cyan-30` | `#014c5b`                     |
| `--wa-color-cyan-20` | `#003844`                     |
| `--wa-color-cyan-10` | `#002129`                     |
| `--wa-color-cyan-05` | `#00151b`                     |
| `--wa-color-cyan`    | alias of `--wa-color-cyan-70` |

### Blue (default brand color)

| Token                | Default Hex                   |
| -------------------- | ----------------------------- |
| `--wa-color-blue-95` | `#e8f3ff`                     |
| `--wa-color-blue-90` | `#d1e8ff`                     |
| `--wa-color-blue-80` | `#9fceff`                     |
| `--wa-color-blue-70` | `#6eb3ff`                     |
| `--wa-color-blue-60` | `#3e96ff`                     |
| `--wa-color-blue-50` | `#0071ec`                     |
| `--wa-color-blue-40` | `#0053c0`                     |
| `--wa-color-blue-30` | `#003f9c`                     |
| `--wa-color-blue-20` | `#002d77`                     |
| `--wa-color-blue-10` | `#001a4e`                     |
| `--wa-color-blue-05` | `#000f35`                     |
| `--wa-color-blue`    | alias of `--wa-color-blue-50` |

### Indigo

| Token                  | Default Hex                     |
| ---------------------- | ------------------------------- |
| `--wa-color-indigo-95` | `#f0f2ff`                       |
| `--wa-color-indigo-90` | `#dfe5ff`                       |
| `--wa-color-indigo-80` | `#bcc7ff`                       |
| `--wa-color-indigo-70` | `#9da9ff`                       |
| `--wa-color-indigo-60` | `#808aff`                       |
| `--wa-color-indigo-50` | `#6163f2`                       |
| `--wa-color-indigo-40` | `#4945cb`                       |
| `--wa-color-indigo-30` | `#3933a7`                       |
| `--wa-color-indigo-20` | `#292381`                       |
| `--wa-color-indigo-10` | `#181255`                       |
| `--wa-color-indigo-05` | `#0d0a3a`                       |
| `--wa-color-indigo`    | alias of `--wa-color-indigo-50` |

### Purple

| Token                  | Default Hex                     |
| ---------------------- | ------------------------------- |
| `--wa-color-purple-95` | `#f7f0ff`                       |
| `--wa-color-purple-90` | `#eedfff`                       |
| `--wa-color-purple-80` | `#ddbdff`                       |
| `--wa-color-purple-70` | `#ca99ff`                       |
| `--wa-color-purple-60` | `#b678f5`                       |
| `--wa-color-purple-50` | `#9951db`                       |
| `--wa-color-purple-40` | `#7936b3`                       |
| `--wa-color-purple-30` | `#612692`                       |
| `--wa-color-purple-20` | `#491870`                       |
| `--wa-color-purple-10` | `#2d0b48`                       |
| `--wa-color-purple-05` | `#1e0532`                       |
| `--wa-color-purple`    | alias of `--wa-color-purple-50` |

### Pink

| Token                | Default Hex                   |
| -------------------- | ----------------------------- |
| `--wa-color-pink-95` | `#feeff9`                     |
| `--wa-color-pink-90` | `#feddf0`                     |
| `--wa-color-pink-80` | `#fcb5d8`                     |
| `--wa-color-pink-70` | `#f78dbf`                     |
| `--wa-color-pink-60` | `#e66ba3`                     |
| `--wa-color-pink-50` | `#c84382`                     |
| `--wa-color-pink-40` | `#9e2a6c`                     |
| `--wa-color-pink-30` | `#7d1e58`                     |
| `--wa-color-pink-20` | `#5e1342`                     |
| `--wa-color-pink-10` | `#3c0828`                     |
| `--wa-color-pink-05` | `#28041a`                     |
| `--wa-color-pink`    | alias of `--wa-color-pink-50` |

### Gray (default neutral)

| Token                | Default Hex                   |
| -------------------- | ----------------------------- |
| `--wa-color-gray-95` | `#f1f2f3`                     |
| `--wa-color-gray-90` | `#e4e5e9`                     |
| `--wa-color-gray-80` | `#c7c9d0`                     |
| `--wa-color-gray-70` | `#abaeb9`                     |
| `--wa-color-gray-60` | `#9194a2`                     |
| `--wa-color-gray-50` | `#717584`                     |
| `--wa-color-gray-40` | `#545868`                     |
| `--wa-color-gray-30` | `#424554`                     |
| `--wa-color-gray-20` | `#2f323f`                     |
| `--wa-color-gray-10` | `#1b1d26`                     |
| `--wa-color-gray-05` | `#101219`                     |
| `--wa-color-gray`    | alias of `--wa-color-gray-40` |

---

## Layer 2 — Semantic Variant Tokens

Defined in `@layer wa-color-variant`. These map a semantic role (brand, neutral, success, warning, danger) onto a hue from the palette. The mapping is controlled by CSS classes on `<html>` and by the `kigumi.config.json` `theme.brandColor` setting.

### Brand Color (`--wa-color-brand-*`)

The brand color is the primary interactive color used for buttons, links, focus rings, and accents.

**Default mapping:** blue (`wa-brand-blue` class or bare `:root`)

| Token                 | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `--wa-color-brand-95` | Lightest tint                                   |
| `--wa-color-brand-90` | Very light tint                                 |
| `--wa-color-brand-80` | Light tint                                      |
| `--wa-color-brand-70` | Medium-light tint                               |
| `--wa-color-brand-60` | Medium tint — used for focus rings              |
| `--wa-color-brand-50` | Medium-dark — used for primary fills            |
| `--wa-color-brand-40` | Dark — used for links                           |
| `--wa-color-brand-30` | Darker                                          |
| `--wa-color-brand-20` | Very dark                                       |
| `--wa-color-brand-10` | Near-black                                      |
| `--wa-color-brand-05` | Darkest                                         |
| `--wa-color-brand`    | Shorthand alias (key step)                      |
| `--wa-color-brand-on` | Accessible text color to pair with the key step |

**Available brand hues (set via `npx kigumi brand <color>`):**
`blue` (default), `red`, `orange`, `yellow`, `green`, `cyan`, `indigo`, `purple`, `pink`, `gray`

### Neutral Color (`--wa-color-neutral-*`)

Used for surfaces, borders, subdued text, and structural UI chrome.

**Default mapping:** gray (`.wa-neutral-gray`)

| Token                   | Purpose                                |
| ----------------------- | -------------------------------------- |
| `--wa-color-neutral-95` | Lightest — very light backgrounds      |
| `--wa-color-neutral-90` | Light — quiet fills, hover backgrounds |
| `--wa-color-neutral-80` | Light-medium                           |
| `--wa-color-neutral-70` | Medium                                 |
| `--wa-color-neutral-60` | Medium — quiet text                    |
| `--wa-color-neutral-50` | Medium-dark                            |
| `--wa-color-neutral-40` | Dark — secondary text                  |
| `--wa-color-neutral-30` | Darker                                 |
| `--wa-color-neutral-20` | Very dark — borders in dark mode       |
| `--wa-color-neutral-10` | Near-black — text in light mode        |
| `--wa-color-neutral-05` | Near-black — dark mode surfaces        |
| `--wa-color-neutral`    | Shorthand alias                        |
| `--wa-color-neutral-on` | Accessible text color to pair with key |

**Available neutral hues:** `gray` (default), `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `indigo`, `purple`, `pink`

### Success Color (`--wa-color-success-*`)

Used for success states, positive feedback, and confirmation badges.

**Default mapping:** green (`.wa-success-green`)

| Token                                                   | Purpose                      |
| ------------------------------------------------------- | ---------------------------- |
| `--wa-color-success-95` through `--wa-color-success-05` | Full scale                   |
| `--wa-color-success`                                    | Shorthand alias              |
| `--wa-color-success-on`                                 | Accessible text on key color |

**Available hues:** `green` (default), `red`, `orange`, `yellow`, `cyan`, `blue`, `indigo`, `purple`, `pink`, `gray`

### Warning Color (`--wa-color-warning-*`)

Used for caution states, pending statuses, and advisory messages.

**Default mapping:** yellow (`.wa-warning-yellow`)

| Token                                                   | Purpose                      |
| ------------------------------------------------------- | ---------------------------- |
| `--wa-color-warning-95` through `--wa-color-warning-05` | Full scale                   |
| `--wa-color-warning`                                    | Shorthand alias              |
| `--wa-color-warning-on`                                 | Accessible text on key color |

**Available hues:** `yellow` (default), `red`, `orange`, `green`, `cyan`, `blue`, `indigo`, `purple`, `pink`, `gray`

### Danger Color (`--wa-color-danger-*`)

Used for error states, destructive actions, and alerts.

**Default mapping:** red (`.wa-danger-red`)

| Token                                                 | Purpose                      |
| ----------------------------------------------------- | ---------------------------- |
| `--wa-color-danger-95` through `--wa-color-danger-05` | Full scale                   |
| `--wa-color-danger`                                   | Shorthand alias              |
| `--wa-color-danger-on`                                | Accessible text on key color |

**Available hues:** `red` (default), `orange`, `yellow`, `green`, `cyan`, `blue`, `indigo`, `purple`, `pink`, `gray`

---

## Layer 3 — Contextual / Adaptive Tokens

These tokens are defined in the theme CSS (`@layer wa-theme`) and change value between light and dark mode. These are the tokens you should reference when styling custom components, because they automatically adapt to the active color scheme.

### Surface Tokens

Surface tokens define page backgrounds and structural layers.

| Token                        | Light                   | Dark                                    |
| ---------------------------- | ----------------------- | --------------------------------------- |
| `--wa-color-surface-default` | `white`                 | `--wa-color-neutral-05`                 |
| `--wa-color-surface-raised`  | `white`                 | `--wa-color-neutral-10`                 |
| `--wa-color-surface-lowered` | `--wa-color-neutral-95` | `color-mix(surface-default, black 20%)` |
| `--wa-color-surface-border`  | `--wa-color-neutral-90` | `--wa-color-neutral-20`                 |

### Text Tokens

| Token                    | Light                   | Dark                    |
| ------------------------ | ----------------------- | ----------------------- |
| `--wa-color-text-normal` | `--wa-color-neutral-10` | `--wa-color-neutral-95` |
| `--wa-color-text-quiet`  | `--wa-color-neutral-40` | `--wa-color-neutral-60` |
| `--wa-color-text-link`   | `--wa-color-brand-40`   | `--wa-color-brand-70`   |

### Overlay Tokens

| Token                       | Light                                    | Dark                                     |
| --------------------------- | ---------------------------------------- | ---------------------------------------- |
| `--wa-color-overlay-modal`  | `color-mix(neutral-05, 50% transparent)` | `color-mix(black, 60% transparent)`      |
| `--wa-color-overlay-inline` | `color-mix(neutral-80, 25% transparent)` | `color-mix(neutral-50, 10% transparent)` |

### Focus Token

| Token              | Value                                       |
| ------------------ | ------------------------------------------- |
| `--wa-color-focus` | `--wa-color-brand-60` (both light and dark) |

### Interaction Mix Tokens

These are used internally by components for hover and active states.

| Token                   | Light       | Dark        |
| ----------------------- | ----------- | ----------- |
| `--wa-color-mix-hover`  | `black 10%` | `black 8%`  |
| `--wa-color-mix-active` | `black 20%` | `black 16%` |

### Semantic Fill / Border / On Tokens

These contextual tokens are what components actually consume. They are adaptive (different values in light vs dark mode). Use these in custom component CSS to stay consistent with the component library.

**Pattern:** `--wa-color-{role}-{property}-{intensity}`

- `{role}`: `brand`, `success`, `warning`, `danger`, `neutral`
- `{property}`: `fill`, `border`, `on`
- `{intensity}`: `quiet`, `normal`, `loud`

| Token                            | Light value | Dark value |
| -------------------------------- | ----------- | ---------- |
| `--wa-color-brand-fill-quiet`    | `brand-95`  | `brand-10` |
| `--wa-color-brand-fill-normal`   | `brand-90`  | `brand-20` |
| `--wa-color-brand-fill-loud`     | `brand-50`  | `brand-50` |
| `--wa-color-brand-border-quiet`  | `brand-90`  | `brand-20` |
| `--wa-color-brand-border-normal` | `brand-80`  | `brand-30` |
| `--wa-color-brand-border-loud`   | `brand-60`  | `brand-40` |
| `--wa-color-brand-on-quiet`      | `brand-40`  | `brand-60` |
| `--wa-color-brand-on-normal`     | `brand-30`  | `brand-70` |
| `--wa-color-brand-on-loud`       | `white`     | `white`    |

The same pattern repeats for `success`, `warning`, `danger`, and `neutral`.

---

## How to Override Color Tokens

All overrides go in `src/styles/theme.css` inside `:root`. This file is loaded into the `theme` CSS cascade layer, which has higher priority than Web Awesome base styles.

### Override brand color globally

```css
/* src/styles/theme.css */
:root {
  /* Override using a single step — all brand-* tokens still work */
  --wa-color-brand-60: #6366f1; /* indigo-ish */
}
```

### Remap brand to a custom brand palette

```css
:root {
  --wa-color-brand-95: #fdf4ff;
  --wa-color-brand-90: #fae8ff;
  --wa-color-brand-80: #f0abfc;
  --wa-color-brand-70: #e879f9;
  --wa-color-brand-60: #d946ef;
  --wa-color-brand-50: #a21caf;
  --wa-color-brand-40: #86198f;
  --wa-color-brand-30: #701a75;
  --wa-color-brand-20: #4a044e;
  --wa-color-brand-10: #2d0036;
  --wa-color-brand-05: #1a0020;
}
```

### Dark mode overrides

```css
/* Use the .wa-dark class applied to <html> */
.wa-dark {
  --wa-color-brand-60: #818cf8;
  --wa-color-surface-default: #1e1e2e;
  --wa-color-surface-text: #cdd6f4;
}
```

### Override surface colors for custom backgrounds

```css
:root {
  --wa-color-surface-default: #fafaf9;
  --wa-color-surface-raised: #ffffff;
  --wa-color-surface-lowered: #f5f5f4;
}
```

---

## Change Brand Color via CLI

Instead of editing CSS directly, you can switch to a different built-in brand color:

```bash
npx kigumi brand purple    # Set brand color to purple
npx kigumi brand blue      # Set back to default blue
```

**Available brand color values:**
`blue` (default), `purple`, `green`, `red`, `orange`, `yellow`, `cyan`, `indigo`, `pink`, `gray`

This writes the appropriate `wa-brand-{color}` class to your `kigumi.ts` setup file. The CSS palette tokens for the chosen hue are automatically aliased to `--wa-color-brand-*`.

---

## Key Tokens for Custom Components

When styling custom components to match the Kigumi/Web Awesome system, use these tokens:

```css
.my-component {
  /* Backgrounds */
  background: var(--wa-color-surface-default);
  background: var(--wa-color-brand-fill-quiet); /* subtle brand tint */
  background: var(--wa-color-brand-fill-loud); /* prominent brand fill */

  /* Text */
  color: var(--wa-color-text-normal);
  color: var(--wa-color-text-quiet);
  color: var(--wa-color-brand-on-loud); /* text on brand-fill-loud */

  /* Borders */
  border-color: var(--wa-color-surface-border);
  border-color: var(--wa-color-brand-border-loud);
  border-color: var(--wa-color-neutral-border-quiet);

  /* Focus */
  outline-color: var(--wa-color-focus); /* = brand-60 */
}
```

---

## Accessibility Notes

- Never rely on color alone to convey meaning. Always pair color with text, icons, or patterns.
- Web Awesome tokens are designed to meet WCAG 2.1 AA contrast standards at their default values.
- The `--wa-color-{role}-on-*` tokens automatically provide accessible text contrast when placed on the corresponding fill color.
- Avoid hardcoding hex values in component CSS. Use tokens so dark mode and palette changes work automatically.
- When overriding palette steps, verify contrast ratios with a tool like the APCA contrast checker.

---

## Palette Options

Kigumi supports multiple color palettes that replace the default hex values for all 10 hues. Available palettes (both Free and Pro):

| Palette       | Notes                            |
| ------------- | -------------------------------- |
| `default`     | Neutral/balanced default palette |
| `bright`      | Higher chroma, more vivid        |
| `shoelace`    | Shoelace-compatible palette      |
| `rudimentary` | Muted, understated               |
| `elegant`     | Refined, medium saturation       |
| `mild`        | Low saturation, calm             |
| `natural`     | Earthy, organic feel             |
| `anodized`    | Metallic-inspired tones          |
| `vogue`       | Fashion-forward, opinionated     |

Switch palettes via CLI:

```bash
npx kigumi palette rudimentary
```

Or set in `kigumi.config.json`:

```json
{
  "theme": {
    "palette": "rudimentary",
    "brandColor": "purple"
  }
}
```

The palette change replaces the primitive values for all 10 hues but preserves all semantic and contextual token relationships unchanged.
