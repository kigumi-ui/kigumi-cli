# Kigumi Color Token Reference

Complete reference of all color tokens available for theming in Kigumi, built on the Web Awesome design token system.

## Color System Architecture

Kigumi's color system has three independent axes that combine to produce the final color output:

1. **Palette** -- Controls the tuning of every hue (saturation, warmth, coolness)
2. **Brand color** -- Sets the primary accent hue used across interactive elements
3. **Dark mode** -- Switches all mode-dependent tokens between light and dark values

These axes are orthogonal: you can change any one without affecting the others.

## Token Layers

Color tokens are organized into two CSS cascade layers:

| Layer              | Priority | Contains                                       |
| ------------------ | -------- | ---------------------------------------------- |
| `wa-color-palette` | 3 of 7   | Palette hue-step values (the raw color scales) |
| `wa-color-variant` | 4 of 7   | Brand and semantic variant mapping             |

Your overrides go in `wa-theme-overrides` (layer 7, highest priority).

---

## 1. Palette Color Scales (Raw Hues)

The palette layer defines 10 hues, each with an 11-step lightness scale. Steps range from `05` (near-black) to `95` (near-white). These are the low-level building blocks that semantic tokens reference.

### Hues

| Hue       | Token pattern               | Used by                         |
| --------- | --------------------------- | ------------------------------- |
| `red`     | `--wa-color-red-{step}`     | Danger variant                  |
| `orange`  | `--wa-color-orange-{step}`  | Warning variant                 |
| `yellow`  | `--wa-color-yellow-{step}`  | (available)                     |
| `green`   | `--wa-color-green-{step}`   | Success variant                 |
| `cyan`    | `--wa-color-cyan-{step}`    | (available)                     |
| `blue`    | `--wa-color-blue-{step}`    | Brand (default)                 |
| `indigo`  | `--wa-color-indigo-{step}`  | (available)                     |
| `purple`  | `--wa-color-purple-{step}`  | (available)                     |
| `pink`    | `--wa-color-pink-{step}`    | (available)                     |
| `gray`    | `--wa-color-gray-{step}`    | (available)                     |
| `neutral` | `--wa-color-neutral-{step}` | Neutral variant, surfaces, text |

### Steps (per hue)

Each hue has these 11 steps:

```
05, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95
```

- `05` = darkest (near black)
- `50` = midpoint (the "loud" fill color)
- `95` = lightest (near white)

Example tokens for blue:

```
--wa-color-blue-05
--wa-color-blue-10
--wa-color-blue-20
--wa-color-blue-30
--wa-color-blue-40
--wa-color-blue-50
--wa-color-blue-60
--wa-color-blue-70
--wa-color-blue-80
--wa-color-blue-90
--wa-color-blue-95
```

This pattern repeats for all 11 hues, producing **121 palette-level color tokens**.

### Palette Options

Palettes control the tuning of every hue (how saturated, warm, or cool colors appear). The step values change per palette.

| Palette       | CSS Class                 | Character                                 |
| ------------- | ------------------------- | ----------------------------------------- |
| `default`     | (no class)                | Balanced, neutral tuning                  |
| `rudimentary` | `.wa-palette-rudimentary` | Muted, minimal saturation. Professional.  |
| `bright`      | `.wa-palette-bright`      | Vivid, high-saturation. Eye-catching.     |
| `elegant`     | `.wa-palette-elegant`     | Slightly desaturated. Sophisticated.      |
| `mild`        | `.wa-palette-mild`        | Gentle, medium saturation. Approachable.  |
| `natural`     | `.wa-palette-natural`     | Earth-toned, organic. Warm and grounded.  |
| `vogue`       | `.wa-palette-vogue`       | Fashion-forward, contemporary balance.    |
| `anodized`    | `.wa-palette-anodized`    | Metallic undertones, technical aesthetic. |

Set via `kigumi.config.json`:

```json
{
  "theme": {
    "palette": "vogue"
  }
}
```

---

## 2. Brand Color Scale

The brand color maps the `--wa-color-brand-{step}` scale to one of the 10 hues. This is the primary accent color used for buttons, links, focus rings, and active states.

### Brand Step Tokens

```
--wa-color-brand-05
--wa-color-brand-10
--wa-color-brand-20
--wa-color-brand-30
--wa-color-brand-40
--wa-color-brand-50
--wa-color-brand-60
--wa-color-brand-70
--wa-color-brand-80
--wa-color-brand-90
--wa-color-brand-95
```

### Available Brand Colors

| Color    | CSS Class           | Maps to               |
| -------- | ------------------- | --------------------- |
| `blue`   | (default, no class) | `--wa-color-blue-*`   |
| `red`    | `.wa-brand-red`     | `--wa-color-red-*`    |
| `orange` | `.wa-brand-orange`  | `--wa-color-orange-*` |
| `yellow` | `.wa-brand-yellow`  | `--wa-color-yellow-*` |
| `green`  | `.wa-brand-green`   | `--wa-color-green-*`  |
| `cyan`   | `.wa-brand-cyan`    | `--wa-color-cyan-*`   |
| `indigo` | `.wa-brand-indigo`  | `--wa-color-indigo-*` |
| `purple` | `.wa-brand-purple`  | `--wa-color-purple-*` |
| `pink`   | `.wa-brand-pink`    | `--wa-color-pink-*`   |
| `gray`   | `.wa-brand-gray`    | `--wa-color-gray-*`   |

Set via `kigumi.config.json`:

```json
{
  "theme": {
    "brandColor": "purple"
  }
}
```

Then run `npx kigumi init` to regenerate theme files.

---

## 3. Semantic Variant Colors

This is the main color API for building UIs. Five semantic variants, each with 3 properties at 3 intensities = **45 tokens**. All are mode-dependent (values change between light and dark).

### Token Pattern

```
--wa-color-{variant}-{property}-{intensity}
```

- **Variants**: `brand`, `success`, `warning`, `danger`, `neutral`
- **Properties**: `fill` (background), `border` (stroke), `on` (text/icon)
- **Intensities**: `quiet` (subtle), `normal` (default), `loud` (saturated/prominent)

### Brand Variant

| Token                            | Light Default         | Dark Default          | Use case                      |
| -------------------------------- | --------------------- | --------------------- | ----------------------------- |
| `--wa-color-brand-fill-quiet`    | `--wa-color-brand-95` | `--wa-color-brand-10` | Subtle brand background       |
| `--wa-color-brand-fill-normal`   | `--wa-color-brand-90` | `--wa-color-brand-20` | Default brand background      |
| `--wa-color-brand-fill-loud`     | `--wa-color-brand-50` | `--wa-color-brand-50` | Primary buttons, strong fills |
| `--wa-color-brand-border-quiet`  | `--wa-color-brand-90` | `--wa-color-brand-20` | Subtle brand border           |
| `--wa-color-brand-border-normal` | `--wa-color-brand-80` | `--wa-color-brand-30` | Default brand border          |
| `--wa-color-brand-border-loud`   | `--wa-color-brand-60` | `--wa-color-brand-40` | Strong brand border           |
| `--wa-color-brand-on-quiet`      | `--wa-color-brand-40` | `--wa-color-brand-60` | Subtle brand text             |
| `--wa-color-brand-on-normal`     | `--wa-color-brand-30` | `--wa-color-brand-70` | Default brand text            |
| `--wa-color-brand-on-loud`       | `white`               | `white`               | Text on loud brand fill       |

### Success Variant

| Token                              | Light Default           | Dark Default            | Use case                         |
| ---------------------------------- | ----------------------- | ----------------------- | -------------------------------- |
| `--wa-color-success-fill-quiet`    | `--wa-color-success-95` | `--wa-color-success-10` | Subtle success background        |
| `--wa-color-success-fill-normal`   | `--wa-color-success-90` | `--wa-color-success-20` | Default success background       |
| `--wa-color-success-fill-loud`     | `--wa-color-success-50` | `--wa-color-success-50` | Confirmation buttons, indicators |
| `--wa-color-success-border-quiet`  | `--wa-color-success-90` | `--wa-color-success-20` | Subtle success border            |
| `--wa-color-success-border-normal` | `--wa-color-success-80` | `--wa-color-success-30` | Default success border           |
| `--wa-color-success-border-loud`   | `--wa-color-success-60` | `--wa-color-success-40` | Strong success border            |
| `--wa-color-success-on-quiet`      | `--wa-color-success-40` | `--wa-color-success-60` | Subtle success text              |
| `--wa-color-success-on-normal`     | `--wa-color-success-30` | `--wa-color-success-70` | Default success text             |
| `--wa-color-success-on-loud`       | `white`                 | `white`                 | Text on loud success fill        |

### Warning Variant

| Token                              | Light Default           | Dark Default            | Use case                   |
| ---------------------------------- | ----------------------- | ----------------------- | -------------------------- |
| `--wa-color-warning-fill-quiet`    | `--wa-color-warning-95` | `--wa-color-warning-10` | Subtle warning background  |
| `--wa-color-warning-fill-normal`   | `--wa-color-warning-90` | `--wa-color-warning-20` | Default warning background |
| `--wa-color-warning-fill-loud`     | `--wa-color-warning-50` | `--wa-color-warning-50` | Warning badges, alerts     |
| `--wa-color-warning-border-quiet`  | `--wa-color-warning-90` | `--wa-color-warning-20` | Subtle warning border      |
| `--wa-color-warning-border-normal` | `--wa-color-warning-80` | `--wa-color-warning-30` | Default warning border     |
| `--wa-color-warning-border-loud`   | `--wa-color-warning-60` | `--wa-color-warning-40` | Strong warning border      |
| `--wa-color-warning-on-quiet`      | `--wa-color-warning-40` | `--wa-color-warning-60` | Subtle warning text        |
| `--wa-color-warning-on-normal`     | `--wa-color-warning-30` | `--wa-color-warning-70` | Default warning text       |
| `--wa-color-warning-on-loud`       | `white`                 | `white`                 | Text on loud warning fill  |

### Danger Variant

| Token                             | Light Default          | Dark Default           | Use case                          |
| --------------------------------- | ---------------------- | ---------------------- | --------------------------------- |
| `--wa-color-danger-fill-quiet`    | `--wa-color-danger-95` | `--wa-color-danger-10` | Subtle danger background          |
| `--wa-color-danger-fill-normal`   | `--wa-color-danger-90` | `--wa-color-danger-20` | Default danger background         |
| `--wa-color-danger-fill-loud`     | `--wa-color-danger-50` | `--wa-color-danger-50` | Error states, destructive buttons |
| `--wa-color-danger-border-quiet`  | `--wa-color-danger-90` | `--wa-color-danger-20` | Subtle danger border              |
| `--wa-color-danger-border-normal` | `--wa-color-danger-80` | `--wa-color-danger-30` | Default danger border             |
| `--wa-color-danger-border-loud`   | `--wa-color-danger-60` | `--wa-color-danger-40` | Strong danger border              |
| `--wa-color-danger-on-quiet`      | `--wa-color-danger-40` | `--wa-color-danger-60` | Subtle danger text                |
| `--wa-color-danger-on-normal`     | `--wa-color-danger-30` | `--wa-color-danger-70` | Default danger text               |
| `--wa-color-danger-on-loud`       | `white`                | `white`                | Text on loud danger fill          |

### Neutral Variant

| Token                              | Light Default           | Dark Default            | Use case                   |
| ---------------------------------- | ----------------------- | ----------------------- | -------------------------- |
| `--wa-color-neutral-fill-quiet`    | `--wa-color-neutral-95` | `--wa-color-neutral-10` | Subtle neutral background  |
| `--wa-color-neutral-fill-normal`   | `--wa-color-neutral-90` | `--wa-color-neutral-20` | Default neutral background |
| `--wa-color-neutral-fill-loud`     | `--wa-color-neutral-20` | `--wa-color-neutral-90` | Strong neutral fill        |
| `--wa-color-neutral-border-quiet`  | `--wa-color-neutral-90` | `--wa-color-neutral-20` | Subtle neutral border      |
| `--wa-color-neutral-border-normal` | `--wa-color-neutral-80` | `--wa-color-neutral-30` | Default neutral border     |
| `--wa-color-neutral-border-loud`   | `--wa-color-neutral-60` | `--wa-color-neutral-40` | Strong neutral border      |
| `--wa-color-neutral-on-quiet`      | `--wa-color-neutral-40` | `--wa-color-neutral-60` | Subtle neutral text        |
| `--wa-color-neutral-on-normal`     | `--wa-color-neutral-30` | `--wa-color-neutral-70` | Default neutral text       |
| `--wa-color-neutral-on-loud`       | `white`                 | `--wa-color-neutral-05` | Text on loud neutral fill  |

---

## 4. Surface Colors

Background and container colors. Mode-dependent.

| Token                        | Light Default           | Dark Default                            | Use case                           |
| ---------------------------- | ----------------------- | --------------------------------------- | ---------------------------------- |
| `--wa-color-surface-raised`  | `white`                 | `--wa-color-neutral-10`                 | Cards, popovers, elevated surfaces |
| `--wa-color-surface-default` | `white`                 | `--wa-color-neutral-05`                 | Default page background            |
| `--wa-color-surface-lowered` | `--wa-color-neutral-95` | `color-mix(surface-default, black 20%)` | Code blocks, wells, recessed areas |
| `--wa-color-surface-border`  | `--wa-color-neutral-90` | `--wa-color-neutral-20`                 | Dividers, card borders, separators |

---

## 5. Text Colors

| Token                    | Light Default           | Dark Default            | Use case             |
| ------------------------ | ----------------------- | ----------------------- | -------------------- |
| `--wa-color-text-normal` | `--wa-color-neutral-10` | `--wa-color-neutral-95` | Primary body text    |
| `--wa-color-text-quiet`  | `--wa-color-neutral-40` | `--wa-color-neutral-60` | Secondary/muted text |
| `--wa-color-text-link`   | `--wa-color-brand-40`   | `--wa-color-brand-70`   | Hyperlink text       |

---

## 6. Utility Colors

| Token                       | Use case                                      |
| --------------------------- | --------------------------------------------- |
| `--wa-color-shadow`         | Shadow color (computed from blur scale)       |
| `--wa-color-focus`          | Focus ring color (defaults to brand-60)       |
| `--wa-color-overlay-modal`  | Modal/dialog backdrop overlay                 |
| `--wa-color-overlay-inline` | Skeleton/loading inline overlay               |
| `--wa-color-mix-hover`      | Hover state darkening (used in `color-mix()`) |
| `--wa-color-mix-active`     | Active/pressed state darkening                |

Note: `--wa-color-mix-hover` and `--wa-color-mix-active` are not standalone colors. They are used as the second argument to `color-mix()`:

```css
color-mix(in oklab, var(--wa-color-brand-fill-loud), var(--wa-color-mix-hover))
```

---

## 7. Form Control Colors

Color tokens used across all form elements (inputs, selects, textareas, switches, checkboxes).

| Token                                      | Default                          | Use case                    |
| ------------------------------------------ | -------------------------------- | --------------------------- |
| `--wa-form-control-background-color`       | `--wa-color-surface-default`     | Input background            |
| `--wa-form-control-border-color`           | `--wa-color-neutral-border-loud` | Input border                |
| `--wa-form-control-activated-color`        | `--wa-color-brand-fill-loud`     | Checked/toggled accent      |
| `--wa-form-control-label-color`            | `--wa-color-text-normal`         | Label text                  |
| `--wa-form-control-value-color`            | `--wa-color-text-normal`         | Input value text            |
| `--wa-form-control-hint-color`             | `--wa-color-text-quiet`          | Help text                   |
| `--wa-form-control-placeholder-color`      | `--wa-color-gray-50`             | Placeholder text            |
| `--wa-form-control-required-content-color` | `inherit`                        | Required indicator asterisk |

---

## 8. Tooltip Colors

| Token                           | Default                         | Use case           |
| ------------------------------- | ------------------------------- | ------------------ |
| `--wa-tooltip-background-color` | `--wa-color-text-normal`        | Tooltip background |
| `--wa-tooltip-border-color`     | `--wa-tooltip-background-color` | Tooltip border     |
| `--wa-tooltip-content-color`    | `--wa-color-surface-default`    | Tooltip text       |

---

## Token Count Summary

| Category                 | Token count | Notes                                     |
| ------------------------ | ----------- | ----------------------------------------- |
| Palette scales (per hue) | 11 steps    | 11 hues x 11 steps = 121 tokens           |
| Brand scale              | 11          | Maps to selected hue                      |
| Semantic variants        | 45          | 5 variants x 3 properties x 3 intensities |
| Surface colors           | 4           | Mode-dependent                            |
| Text colors              | 3           | Mode-dependent                            |
| Utility colors           | 6           | Focus, shadow, overlay, mix states        |
| Form control colors      | 8           | Shared across all form elements           |
| Tooltip colors           | 3           | Inverted color scheme                     |
| **Total color tokens**   | **~201**    |                                           |

---

## Dark Mode

All color tokens are mode-dependent. Dark mode is activated by adding the `.wa-dark` class to `<html>`:

```tsx
document.documentElement.classList.toggle('wa-dark', isDark);
```

Additional mode classes:

| Class        | Effect                                            |
| ------------ | ------------------------------------------------- |
| `.wa-dark`   | Activates dark mode                               |
| `.wa-light`  | Forces light mode (useful inside a dark ancestor) |
| `.wa-invert` | Locally inverts the current mode for a subtree    |

---

## How to Override Color Tokens

All color overrides must be placed inside `@layer wa-theme-overrides` to respect the cascade.

### Override surface and text colors

```css
@layer wa-theme-overrides {
  :root {
    --wa-color-surface-default: #fafafa;
    --wa-color-surface-raised: #ffffff;
    --wa-color-surface-border: #e0e0e0;
    --wa-color-text-normal: #1a1a2e;
    --wa-color-text-quiet: #64748b;
  }

  .wa-dark {
    --wa-color-surface-default: #0a0a0a;
    --wa-color-surface-raised: #171717;
    --wa-color-surface-border: #333333;
    --wa-color-text-normal: #f8fafc;
    --wa-color-text-quiet: #94a3b8;
  }
}
```

### Override semantic variant colors

```css
@layer wa-theme-overrides {
  :root {
    --wa-color-brand-fill-loud: #7c3aed;
    --wa-color-brand-on-loud: white;
  }
}
```

### Change focus ring color

```css
@layer wa-theme-overrides {
  :root {
    --wa-color-focus: #7c3aed;
  }
}
```

---

## Key Design Decisions

1. **No per-component color tokens.** There are no `--wa-button-color`, `--wa-input-color`, or `--wa-card-color` tokens. Use `::part()` selectors for component-specific color changes.
2. **Semantic tokens reference palette steps.** For example, `--wa-color-brand-fill-loud` resolves to `--wa-color-brand-50`, which resolves to the palette step for the selected brand hue. Override at whichever level makes sense.
3. **Never use `!important`.** The 7-layer cascade system handles specificity. Place overrides in `@layer wa-theme-overrides`.
4. **Always test both modes.** Color overrides in `:root` only affect light mode. Add matching `.wa-dark` overrides for dark mode.

---

**Source:** Web Awesome 3.4.0, Kigumi CLI skill references
**Documentation:** [kigumi.style](https://kigumi.style) | [webawesome.com/docs/theming](https://webawesome.com/docs/theming)
