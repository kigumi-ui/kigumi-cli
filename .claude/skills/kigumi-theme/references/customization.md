# Theme Customization Guide

Step-by-step guides for customizing Kigumi themes at three levels of control.

## Table of Contents

- [Quick Start](#quick-start)
- [Level 1: Config-Based (Recommended)](#level-1-config-based-recommended)
- [Level 2: CSS Variable Overrides](#level-2-css-variable-overrides)
- [Level 3: Custom Theme](#level-3-custom-theme)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

Ensure you have:

- Initialized Kigumi in your project: `npx kigumi init`
- A `kigumi.config.json` file in your project root
- `layers.css` generated in your styles directory (`src/styles/layers.css` by default) and imported by the generated `kigumi.ts`

## Level 1: Config-Based (Recommended)

The simplest way to customize your theme. Edit `kigumi.config.json` and regenerate.

### Change Brand Color

Edit `kigumi.config.json`:

```json
{
  "framework": "react",
  "typescript": true,
  "componentsDir": "src/components/ui",
  "utilsDir": "src/lib",
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary",
    "brandColor": "blue"
  }
}
```

Then regenerate theme files:

```bash
npx kigumi init
```

This updates the generated `layers.css` and `kigumi.ts` with the new brand color. Brand color is applied via the `.wa-brand-{color}` class.

Available brand colors: `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `indigo`, `purple`, `pink`, `gray`

### Switch Palette

Palettes control the overall color tuning. Change the `palette` field:

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary"
  }
}
```

Available palettes: `default`, `rudimentary`, `bright`, `elegant`, `mild`, `natural`, `vogue`, `anodized`

Palettes are applied via `.wa-palette-{name}` classes. The `default` palette requires no class.

### Switch Theme

Themes control the overall visual style (typography, spacing, rounding, shadows, etc.):

```json
{
  "theme": {
    "selected": "tailspin"
  }
}
```

Themes are applied via `.wa-theme-{name}` classes. The `default` theme requires no class.

See [available-themes.md](available-themes.md) for full theme list.

## Level 2: CSS Variable Overrides

Fine-grained control by overriding specific CSS custom properties. Use this when config-based options are not flexible enough.

Two files of yours hold the customizations, both created by `kigumi init` and never overwritten. Both are plain CSS: the generated `layers.css` already places each file in its cascade layer, so do not add `@layer` wrappers.

- `theme.css` (layer `theme`): design tokens, as `:root { --wa-*: ... }` and `.wa-dark { ... }` blocks
- `overrides.css` (layer `overrides`): CSS rules no token expresses, such as `::part()` styling

See [The Three Layers](#the-three-layers) for how they stack. The snippets below say which file each belongs in.

### Scale Token Overrides

Scale tokens are the most powerful single-property customization lever. One value cascades to all derived tokens in that category.

```css
/* src/styles/theme.css */
:root {
  /* Sharp corners everywhere */
  --wa-border-radius-scale: 0;

  /* More spacious layout */
  --wa-space-scale: 1.5;

  /* Larger text globally */
  --wa-font-size-scale: 1.1;

  /* Thicker borders */
  --wa-border-width-scale: 2;

  /* Softer, more diffused shadows */
  --wa-shadow-blur-scale: 3;
  --wa-shadow-spread-scale: 0;
}
```

Available scale tokens:

| Token                        | Default | Effect                                      |
| ---------------------------- | ------- | ------------------------------------------- |
| `--wa-font-size-scale`       | `1`     | Multiplies all font sizes                   |
| `--wa-space-scale`           | `1`     | Multiplies all spacing values               |
| `--wa-border-radius-scale`   | `1`     | Multiplies all border radii (0 = sharp)     |
| `--wa-border-width-scale`    | `1`     | Multiplies all border widths                |
| `--wa-shadow-offset-x-scale` | `0`     | Controls horizontal shadow direction        |
| `--wa-shadow-offset-y-scale` | `1`     | Controls vertical shadow direction          |
| `--wa-shadow-blur-scale`     | `1`     | Controls shadow softness                    |
| `--wa-shadow-spread-scale`   | `-0.5`  | Controls shadow spread (negative = tighter) |

### Surface and Text Color Overrides

Override specific colors for your brand:

```css
/* src/styles/theme.css */
:root {
  --wa-color-surface-default: #fafafa;
  --wa-color-surface-raised: #ffffff;
  --wa-color-surface-lowered: #f0f0f0;
  --wa-color-surface-border: #e0e0e0;

  --wa-color-text-normal: #1a1a2e;
  --wa-color-text-quiet: #64748b;
}

.wa-dark {
  --wa-color-surface-default: #0f172a;
  --wa-color-surface-raised: #1e293b;
  --wa-color-surface-lowered: #020617;
  --wa-color-surface-border: #334155;

  --wa-color-text-normal: #f8fafc;
  --wa-color-text-quiet: #94a3b8;
}
```

### Typography Overrides

```css
/* src/styles/theme.css */
:root {
  --wa-font-family-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --wa-font-family-heading: 'Cal Sans', var(--wa-font-family-body);
  --wa-font-family-code: 'JetBrains Mono', ui-monospace, monospace;

  --wa-font-weight-bold: 700;
  --wa-font-weight-heading: 800;
  --wa-line-height-normal: 1.75;
}
```

### Component Styling with `::part()`

Web Awesome components expose their internal structure through CSS Parts. This is the public API for styling individual components. There are NO `--wa-button-*`, `--wa-input-*`, or `--wa-card-*` tokens.

Put these rules in `overrides.css`. Select components by their tag (`wa-button::part(base)`), which works in React, Vue and Angular alike. Only the React wrappers also put a PascalCase class on the host (`<wa-button class="Button ...">`), so `.Button::part(base)` is React-only.

```css
/* src/styles/overrides.css */

/* Make buttons uppercase with sharp corners */
wa-button::part(base) {
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Custom input background */
wa-input::part(base) {
  background: var(--wa-color-surface-raised);
}

/* Add a bottom border to card headers */
wa-card::part(header) {
  border-bottom: var(--wa-border-width-s) solid var(--wa-color-surface-border);
}

/* Separate the dialog header from its body */
wa-dialog::part(header) {
  border-bottom: var(--wa-border-width-s) var(--wa-border-style)
    var(--wa-color-surface-border);
}

/* Lift the switch thumb */
wa-switch::part(thumb) {
  box-shadow: var(--wa-shadow-s);
}
```

### The Three Layers

`layers.css` is generated by Kigumi in your styles directory. It declares `@layer base, theme, overrides;` and imports each source into one layer, ordered from lowest to highest priority:

1. `base` -- Web Awesome's styles, the selected theme and the selected palette (generated; do not edit)
2. `theme` -- `theme.css`, your design tokens
3. `overrides` -- `overrides.css`, your custom CSS rules

```css
@layer base, theme, overrides;
@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/<theme>.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/color/palettes/<palette>.css'
  layer(base);
@import './theme.css' layer(theme);
@import './overrides.css' layer(overrides);
```

A later layer beats an earlier one regardless of selector specificity, so your files win over Web Awesome, and `overrides.css` wins over `theme.css`, without `!important`. Web Awesome's own eight internal layers (`wa-native`, `wa-base`, `wa-utilities`, `wa-color-palette`, `wa-color-variant`, `wa-theme`, `wa-theme-dimension`, `wa-theme-overrides`) are nested inside `base`, so they never compete with your files.

**Write plain CSS in `theme.css` and `overrides.css`; do not add `@layer` wrappers.** Each file is already inside its layer. A `@layer wa-theme-overrides { ... }` block in `theme.css` would become the nested layer `theme.wa-theme-overrides`, which loses to unlayered rules in `theme.css` itself and to everything in `overrides.css`.

```css
/* src/styles/theme.css: tokens */
:root {
  --wa-border-radius-scale: 0;
  --wa-font-family-body: 'Inter', system-ui, sans-serif;
}

.wa-dark {
  --wa-color-surface-default: #0a0a0a;
}
```

```css
/* src/styles/overrides.css: rules */
wa-button::part(base) {
  text-transform: uppercase;
}
```

You do not import these files yourself. `layers.css` imports them, and the generated `kigumi.ts` (`src/lib/kigumi.ts` by default) imports `layers.css`. `kigumi init`, `theme`, `brand`, `palette` and `upgrade` create `overrides.css` when it is missing; `upgrade` also adds the `overrides` layer to a `layers.css` written by an older CLI.

#### Next.js Pages Router

Next's Pages Router CSS pipeline drops an `@import` that carries `layer(...)`, so Kigumi writes these imports without it, and nothing lands in `base`, `theme` or `overrides`. `theme.css` tokens still apply, and `overrides.css` beats `theme.css` only by coming later in source order. A rule in `overrides.css` must therefore be at least as specific as the rule it overrides. Next only allows global CSS imports in `pages/_app.tsx`, so that file imports `@/styles/layers.css` and `@/lib/kigumi` directly.

## Level 3: Custom Theme

Build a fully custom theme from scratch for maximum control.

### Dark Mode Toggle

Dark mode uses the `.wa-dark` class on the `<html>` element. Light mode uses `.wa-light` or no class (default).

```tsx
// src/components/ThemeToggle.tsx
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('wa-dark-mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('wa-dark', dark);
    localStorage.setItem('wa-dark-mode', String(dark));
  }, [dark]);

  return (
    <wa-switch checked={dark} onInput={() => setDark(!dark)}>
      Dark mode
    </wa-switch>
  );
}
```

Key points:

- Use `.wa-dark` (not `.dark`) to toggle dark mode
- Use `.wa-light` to force light mode in a dark context
- Use `.wa-invert` to locally invert the color scheme of a subtree

### Local Color Inversion

The `.wa-invert` class flips a section's color scheme without toggling the entire page:

```html
<!-- Dark page with a light card -->
<html class="wa-dark">
  <body>
    <wa-card class="wa-invert">
      <!-- This card renders in light mode -->
    </wa-card>
  </body>
</html>
```

### System Preference Detection

Respond to the user's OS-level color scheme preference:

```tsx
useEffect(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    document.documentElement.classList.toggle('wa-dark', e.matches);
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);
```

### Full Custom Theme File

Tokens go in `theme.css`:

```css
/* src/styles/theme.css */
:root {
  /* Typography */
  --wa-font-family-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --wa-font-family-heading: var(--wa-font-family-body);
  --wa-font-family-code: 'Fira Code', ui-monospace, monospace;
  --wa-font-weight-bold: 700;
  --wa-font-weight-heading: 700;

  /* Scale adjustments */
  --wa-border-radius-scale: 1.5;
  --wa-space-scale: 1;
  --wa-font-size-scale: 1;

  /* Surface colors */
  --wa-color-surface-default: #fefefe;
  --wa-color-surface-raised: #ffffff;
  --wa-color-surface-lowered: #f5f5f5;
  --wa-color-surface-border: #e5e5e5;

  /* Text colors */
  --wa-color-text-normal: #171717;
  --wa-color-text-quiet: #525252;
  --wa-color-text-link: #2563eb;
}

.wa-dark {
  --wa-color-surface-default: #0a0a0a;
  --wa-color-surface-raised: #171717;
  --wa-color-surface-lowered: #050505;
  --wa-color-surface-border: #262626;

  --wa-color-text-normal: #fafafa;
  --wa-color-text-quiet: #a3a3a3;
  --wa-color-text-link: #60a5fa;
}
```

Component-specific styling via `::part()` goes in `overrides.css`:

```css
/* src/styles/overrides.css */
wa-button::part(base) {
  font-weight: 600;
}

wa-card::part(footer) {
  border-top: var(--wa-border-width-s) var(--wa-border-style)
    var(--wa-color-surface-border);
}
```

Both files are already imported by the generated `layers.css`, so there is nothing to import. Keep them in the styles directory next to `layers.css`.

## Best Practices

- Put design tokens in `theme.css` and custom CSS rules in `overrides.css`, both as plain CSS with no `@layer` wrapper
- Prefer scale tokens for proportional changes (radius, spacing, font size, borders, shadows)
- Use `::part()` to style individual component internals, not invented `--wa-button-*` tokens
- Test in both light and `.wa-dark` modes
- Never use `!important` -- the `base < theme < overrides` layers handle specificity
- Keep customizations in `theme.css` and `overrides.css`, separate from the generated `layers.css`
- Never edit generated `layers.css` directly (Kigumi regenerates it when the theme, brand color or palette changes)

## Troubleshooting

### Theme not applying

1. Check that the generated `kigumi.ts` is imported (it imports `layers.css`); on the Next.js Pages Router, `pages/_app.tsx` must import `@/styles/layers.css` and `@/lib/kigumi`
2. Verify tokens are in `theme.css` and rules in `overrides.css`, with no `@layer` wrapper in either file
3. Check browser console for CSS import errors
4. Verify `kigumi.config.json` has valid theme values

### Dark mode not working

1. Confirm the `.wa-dark` class (not `.dark`) is being toggled on `<html>`
2. Check that your override variables have `.wa-dark` selectors
3. Inspect the element in DevTools to see which CSS variables are active

### Custom styles not taking effect

1. Ensure tokens are in `theme.css` and rules in `overrides.css`, as plain CSS without `@layer`
2. Verify `layers.css` still imports `./theme.css` and `./overrides.css` (`npx kigumi upgrade` adds a missing `overrides.css` import)
3. On the Next.js Pages Router the layers are not applied, so give the selector in `overrides.css` at least the specificity of the rule it overrides
4. Check that `::part()` names are correct (inspect the component's shadow DOM)
5. Clear browser cache

### Component-specific changes not working

Components are styled through two mechanisms:

1. **CSS custom properties** (`--wa-form-control-*`, `--wa-panel-*`, etc.) for shared token overrides
2. **`::part()` selectors** for targeting specific component internals

There are no `--wa-button-*`, `--wa-input-*`, or `--wa-card-*` tokens. If you need to change a specific component's appearance, use `::part()`.

---

**Documentation:** [kigumi.style](https://kigumi.style)
**Web Awesome Theming:** [webawesome.com/docs/theming](https://webawesome.com/docs/theming)
