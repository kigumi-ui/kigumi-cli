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
- `src/lib/layers.css` generated and imported in your app

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

This updates `src/lib/layers.css` with the new brand color. Brand color is applied via the `.wa-brand-{color}` class.

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

### Scale Token Overrides

Scale tokens are the most powerful single-property customization lever. One value cascades to all derived tokens in that category.

```css
@layer wa-theme-overrides {
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
@layer wa-theme-overrides {
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
}
```

### Typography Overrides

```css
@layer wa-theme-overrides {
  :root {
    --wa-font-family-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
    --wa-font-family-heading: 'Cal Sans', var(--wa-font-family-body);
    --wa-font-family-code: 'JetBrains Mono', ui-monospace, monospace;

    --wa-font-weight-bold: 700;
    --wa-font-weight-heading: 800;
    --wa-line-height-normal: 1.75;
  }
}
```

### Component Styling with `::part()`

Web Awesome components expose their internal structure through CSS Parts. This is the public API for styling individual components. There are NO `--wa-button-*`, `--wa-input-*`, or `--wa-card-*` tokens.

```css
@layer wa-theme-overrides {
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

  /* Style dialog overlay */
  wa-dialog::part(overlay) {
    background: var(--wa-color-overlay-modal);
    backdrop-filter: blur(4px);
  }

  /* Custom switch track color when checked */
  wa-switch::part(control--checked) {
    background: var(--wa-color-brand-fill-loud);
  }
}
```

### The `@layer wa-theme-overrides` Rule

All custom CSS should go in the `wa-theme-overrides` cascade layer. This is the highest-priority layer in the Web Awesome layer stack, so your overrides always win without needing `!important`.

The 7 cascade layers in order (lowest to highest priority):

1. `wa-native` -- Browser reset / normalization
2. `wa-utilities` -- Utility classes
3. `wa-color-palette` -- Palette color definitions
4. `wa-color-variant` -- Brand/semantic color mapping
5. `wa-theme` -- Theme token definitions
6. `wa-theme-dimension` -- Dimensional overrides
7. `wa-theme-overrides` -- Your custom overrides

Create a `theme.css` file and wrap your overrides:

```css
/* src/styles/theme.css */
@layer wa-theme-overrides {
  :root {
    --wa-border-radius-scale: 0;
    --wa-font-family-body: 'Inter', system-ui, sans-serif;
  }

  .wa-dark {
    --wa-color-surface-default: #0a0a0a;
  }

  wa-button::part(base) {
    text-transform: uppercase;
  }
}
```

Import it after `layers.css` in your entry point:

```tsx
// src/main.tsx
import './lib/layers.css'; // Kigumi theme (first)
import './styles/theme.css'; // Your overrides (second)
```

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

```css
/* src/styles/my-theme.css */
@layer wa-theme-overrides {
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

  /* Component-specific styling via ::part() */
  wa-button::part(base) {
    font-weight: 600;
  }

  wa-card::part(base) {
    border: var(--wa-border-width-s) var(--wa-border-style)
      var(--wa-color-surface-border);
  }
}
```

Import it after `layers.css`:

```tsx
import './lib/layers.css';
import './styles/my-theme.css';
```

## Best Practices

- Use `@layer wa-theme-overrides` for all custom CSS to respect cascade ordering
- Prefer scale tokens for proportional changes (radius, spacing, font size, borders, shadows)
- Use `::part()` to style individual component internals, not invented `--wa-button-*` tokens
- Test in both light and `.wa-dark` modes
- Never use `!important` -- the cascade layer system handles specificity
- Keep customizations in separate files from generated `layers.css`
- Never edit generated `layers.css` directly (it gets overwritten on `npx kigumi init`)

## Troubleshooting

### Theme not applying

1. Check that `layers.css` is imported in your entry point
2. Verify your custom CSS is in `@layer wa-theme-overrides`
3. Check browser console for CSS import errors
4. Verify `kigumi.config.json` has valid theme values

### Dark mode not working

1. Confirm the `.wa-dark` class (not `.dark`) is being toggled on `<html>`
2. Check that your override variables have `.wa-dark` selectors
3. Inspect the element in DevTools to see which CSS variables are active

### Custom styles not taking effect

1. Ensure overrides are inside `@layer wa-theme-overrides`
2. Verify import order: `layers.css` first, then your custom CSS
3. Check that `::part()` names are correct (inspect the component's shadow DOM)
4. Clear browser cache

### Component-specific changes not working

Components are styled through two mechanisms:

1. **CSS custom properties** (`--wa-form-control-*`, `--wa-panel-*`, etc.) for shared token overrides
2. **`::part()` selectors** for targeting specific component internals

There are no `--wa-button-*`, `--wa-input-*`, or `--wa-card-*` tokens. If you need to change a specific component's appearance, use `::part()`.

---

**Documentation:** [kigumi.style](https://kigumi.style)
**Web Awesome Theming:** [webawesome.com/docs/theming](https://webawesome.com/docs/theming)
