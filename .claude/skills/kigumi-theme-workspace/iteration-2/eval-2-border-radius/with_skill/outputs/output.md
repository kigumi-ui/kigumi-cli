# Making All Border Radii Larger Across Your Kigumi App

The easiest way to make everything more rounded is to override the **`--wa-border-radius-scale`** token. This is a single CSS custom property that acts as a global multiplier for all border radius values in Web Awesome. Every radius token (`--wa-border-radius-s`, `--wa-border-radius-m`, `--wa-border-radius-l`) and every component that references them (buttons, inputs, cards, panels, tooltips, dialogs, etc.) will scale proportionally from this one change.

## The One-Line Solution

Add this to your project's CSS, inside the `@layer wa-theme-overrides` cascade layer:

```css
@layer wa-theme-overrides {
  :root {
    --wa-border-radius-scale: 1.5;
  }
}
```

This increases all border radii by 50%. The default value is `1`.

## How It Works

All border radius tokens in Web Awesome are calculated using the scale multiplier:

| Token                  | Formula                                           | Default (scale=1) | With scale=1.5 |
| ---------------------- | ------------------------------------------------- | ----------------- | -------------- |
| `--wa-border-radius-s` | `calc(var(--wa-border-radius-scale) * 0.1875rem)` | 3px               | 4.5px          |
| `--wa-border-radius-m` | `calc(var(--wa-border-radius-scale) * 0.375rem)`  | 6px               | 9px            |
| `--wa-border-radius-l` | `calc(var(--wa-border-radius-scale) * 0.75rem)`   | 12px              | 18px           |

The special values `--wa-border-radius-pill` (9999px), `--wa-border-radius-circle` (50%), and `--wa-border-radius-square` (0px) are absolute and are not affected by the scale.

Components like form controls (`--wa-form-control-border-radius` references `--wa-border-radius-m`), panels (`--wa-panel-border-radius` references `--wa-border-radius-l`), and tooltips (`--wa-tooltip-border-radius` references `--wa-border-radius-s`) all inherit from these tokens, so they all get rounder automatically.

## Where to Put It

Create a `theme.css` file (or add to your existing one) and import it after `layers.css` in your app's entry point:

```css
/* src/styles/theme.css */
@layer wa-theme-overrides {
  :root {
    --wa-border-radius-scale: 1.5;
  }
}
```

```tsx
// src/main.tsx
import './lib/layers.css'; // Kigumi theme (generated, do not edit)
import './styles/theme.css'; // Your overrides (after layers.css)
```

The `@layer wa-theme-overrides` layer is the highest-priority layer in the Web Awesome cascade system, so your override will always apply without needing `!important`.

## Suggested Values

| Scale Value | Effect                                  |
| ----------- | --------------------------------------- |
| `0`         | Sharp/square corners everywhere         |
| `0.5`       | Subtly rounded                          |
| `1`         | Default                                 |
| `1.5`       | Noticeably rounder                      |
| `2`         | Very rounded                            |
| `3`+        | Heavily rounded (approaches pill shape) |

Pick the value that matches your design intent. A value of `1.5` to `2` typically gives a soft, modern look without going overboard.

## Important Notes

- Do not edit `src/lib/layers.css` directly. It gets overwritten when you run `npx kigumi init`.
- The scale token works in both light mode and dark mode with no additional configuration.
- If you need a specific component to have a different radius than the global scale, use `::part()` to override that component individually:

```css
@layer wa-theme-overrides {
  /* Example: keep buttons pill-shaped regardless of global scale */
  wa-button::part(base) {
    border-radius: var(--wa-border-radius-pill);
  }
}
```
