# Color Tokens Available for Theming in Kigumi

Kigumi's color system is built on Web Awesome's CSS custom properties. Colors are organized into several categories, all using the `--wa-` prefix.

## Color System Architecture

The color system has three layers:

1. **Palette colors** (low-level): Raw hue-step values like `--wa-color-blue-50`. These are defined by the palette you select (e.g., `rudimentary`, `vogue`, `bright`). You rarely override these directly.
2. **Semantic variant colors** (mid-level): Purpose-driven tokens like `--wa-color-brand-fill-loud` that map to palette steps. These change between light and dark mode.
3. **Surface, text, and utility colors** (high-level): Application-level tokens like `--wa-color-surface-default` and `--wa-color-text-normal`.

You typically work with the semantic and application-level tokens. The palette layer is controlled by your `palette` config setting.

---

## 1. Surface Colors

Background and container colors. These change between light and dark mode.

| Variable                     | Light Default | Dark Default            | Description                           |
| ---------------------------- | ------------- | ----------------------- | ------------------------------------- |
| `--wa-color-surface-raised`  | `white`       | `neutral-10`            | Elevated surface (cards, popovers)    |
| `--wa-color-surface-default` | `white`       | `neutral-05`            | Default page background               |
| `--wa-color-surface-lowered` | `neutral-95`  | surface-default + black | Recessed surface (code blocks, wells) |
| `--wa-color-surface-border`  | `neutral-90`  | `neutral-20`            | Border color for surface elements     |

## 2. Text Colors

| Variable                 | Light Default | Dark Default | Description          |
| ------------------------ | ------------- | ------------ | -------------------- |
| `--wa-color-text-normal` | `neutral-10`  | `neutral-95` | Primary text color   |
| `--wa-color-text-quiet`  | `neutral-40`  | `neutral-60` | Secondary/muted text |
| `--wa-color-text-link`   | `brand-40`    | `brand-70`   | Link text color      |

## 3. Semantic Variant Colors (45 tokens)

This is the core of the color system. There are **5 variants**, each with **3 properties** at **3 intensities**, totaling 45 tokens.

**Pattern:** `--wa-color-{variant}-{property}-{intensity}`

- **Variants:** `brand`, `success`, `warning`, `danger`, `neutral`
- **Properties:** `fill` (background), `border` (stroke), `on` (text/icon on that fill)
- **Intensities:** `quiet` (subtle), `normal` (default), `loud` (saturated/prominent)

### Brand

| Variable                         | Light Default | Dark Default | Purpose                        |
| -------------------------------- | ------------- | ------------ | ------------------------------ |
| `--wa-color-brand-fill-quiet`    | `brand-95`    | `brand-10`   | Subtle brand background        |
| `--wa-color-brand-fill-normal`   | `brand-90`    | `brand-20`   | Default brand background       |
| `--wa-color-brand-fill-loud`     | `brand-50`    | `brand-50`   | Saturated brand fill (buttons) |
| `--wa-color-brand-border-quiet`  | `brand-90`    | `brand-20`   | Subtle brand border            |
| `--wa-color-brand-border-normal` | `brand-80`    | `brand-30`   | Default brand border           |
| `--wa-color-brand-border-loud`   | `brand-60`    | `brand-40`   | Strong brand border            |
| `--wa-color-brand-on-quiet`      | `brand-40`    | `brand-60`   | Subtle brand text              |
| `--wa-color-brand-on-normal`     | `brand-30`    | `brand-70`   | Default brand text             |
| `--wa-color-brand-on-loud`       | `white`       | `white`      | Text on loud brand fill        |

### Success

Same pattern with `success` variant:

- `--wa-color-success-fill-{quiet,normal,loud}`
- `--wa-color-success-border-{quiet,normal,loud}`
- `--wa-color-success-on-{quiet,normal,loud}`

### Warning

Same pattern with `warning` variant:

- `--wa-color-warning-fill-{quiet,normal,loud}`
- `--wa-color-warning-border-{quiet,normal,loud}`
- `--wa-color-warning-on-{quiet,normal,loud}`

### Danger

Same pattern with `danger` variant:

- `--wa-color-danger-fill-{quiet,normal,loud}`
- `--wa-color-danger-border-{quiet,normal,loud}`
- `--wa-color-danger-on-{quiet,normal,loud}`

### Neutral

Same pattern with `neutral` variant:

- `--wa-color-neutral-fill-{quiet,normal,loud}`
- `--wa-color-neutral-border-{quiet,normal,loud}`
- `--wa-color-neutral-on-{quiet,normal,loud}`

## 4. Utility Colors

| Variable                    | Description                                   |
| --------------------------- | --------------------------------------------- |
| `--wa-color-shadow`         | Shadow color (computed from blur scale)       |
| `--wa-color-focus`          | Focus ring color (`brand-60`)                 |
| `--wa-color-overlay-modal`  | Modal backdrop overlay                        |
| `--wa-color-overlay-inline` | Inline overlay (skeleton, loading)            |
| `--wa-color-mix-hover`      | Hover state mix value (used in `color-mix()`) |
| `--wa-color-mix-active`     | Active/pressed state mix value                |

Note: `--wa-color-mix-hover` and `--wa-color-mix-active` are not standalone colors. They are used inside `color-mix()` functions, e.g., `color-mix(in oklab, var(--wa-color-brand-fill-loud), var(--wa-color-mix-hover))`.

## 5. Brand Color Selection

The `brand` variant maps to whichever hue you select in `kigumi.config.json`. Available brand colors:

| Color    | CSS Class           | Maps `--wa-color-brand-*` to |
| -------- | ------------------- | ---------------------------- |
| `blue`   | (default, no class) | `--wa-color-blue-*`          |
| `red`    | `.wa-brand-red`     | `--wa-color-red-*`           |
| `orange` | `.wa-brand-orange`  | `--wa-color-orange-*`        |
| `yellow` | `.wa-brand-yellow`  | `--wa-color-yellow-*`        |
| `green`  | `.wa-brand-green`   | `--wa-color-green-*`         |
| `cyan`   | `.wa-brand-cyan`    | `--wa-color-cyan-*`          |
| `indigo` | `.wa-brand-indigo`  | `--wa-color-indigo-*`        |
| `purple` | `.wa-brand-purple`  | `--wa-color-purple-*`        |
| `pink`   | `.wa-brand-pink`    | `--wa-color-pink-*`          |
| `gray`   | `.wa-brand-gray`    | `--wa-color-gray-*`          |

Set via config:

```json
{
  "theme": {
    "selected": "tailspin",
    "palette": "vogue",
    "brandColor": "purple"
  }
}
```

Then run `npx kigumi init` to regenerate.

## 6. Palette Colors (Low-Level)

Each palette defines a full color scale for 10 hues, each with 11 steps (05, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95):

- `--wa-color-red-{step}`
- `--wa-color-orange-{step}`
- `--wa-color-yellow-{step}`
- `--wa-color-green-{step}`
- `--wa-color-cyan-{step}`
- `--wa-color-blue-{step}`
- `--wa-color-indigo-{step}`
- `--wa-color-purple-{step}`
- `--wa-color-pink-{step}`
- `--wa-color-gray-{step}` / `--wa-color-neutral-{step}`

Steps go from dark (05) to light (95). Step 50 is the mid-point. The exact color values depend on which palette you selected (e.g., `rudimentary` is desaturated, `bright` is vivid).

Available palettes: `default`, `rudimentary`, `bright`, `elegant`, `mild`, `natural`, `vogue`, `anodized`.

## How to Override Color Tokens

Override any color token inside `@layer wa-theme-overrides`:

```css
/* src/styles/theme.css */
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

Import after `layers.css`:

```tsx
import './lib/layers.css';
import './styles/theme.css';
```

## Summary

Total color tokens available for theming:

- **4** surface colors
- **3** text colors
- **45** semantic variant colors (5 variants x 3 properties x 3 intensities)
- **6** utility colors
- **110** palette step colors (10 hues x 11 steps) per palette

That gives you 58 semantic/application-level color tokens to work with, plus the full palette scale underneath. The easiest way to change the overall color feel is to switch the `palette` and `brandColor` in your config. For fine-grained control, override individual tokens in `@layer wa-theme-overrides`.
