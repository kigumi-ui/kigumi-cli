# Making All Border Radius Values Larger

The easiest way to make everything more rounded across your entire Kigumi app is to use the **border radius scale token**. This is a single CSS variable that acts as a global multiplier for all border radii in the system.

## The Scale Token Approach

Override `--wa-border-radius-scale` in `@layer wa-theme-overrides`:

```css
/* src/styles/theme.css */
@layer wa-theme-overrides {
  :root {
    --wa-border-radius-scale: 2;
  }
}
```

This doubles every border radius value throughout the app. Here is what happens to the individual radius tokens:

| Token                  | Default (scale=1) | With scale=2 |
| ---------------------- | ----------------- | ------------ |
| `--wa-border-radius-s` | 3px               | 6px          |
| `--wa-border-radius-m` | 6px               | 12px         |
| `--wa-border-radius-l` | 12px              | 24px         |

The `--wa-border-radius-pill` (9999px), `--wa-border-radius-circle` (50%), and `--wa-border-radius-square` (0px) tokens are absolute values and are not affected by the scale multiplier.

## How to Apply

1. Create a `src/styles/theme.css` file (or add to your existing custom theme file).
2. Add the scale override inside `@layer wa-theme-overrides`.
3. Import it **after** `layers.css` in your entry point:

```tsx
// src/main.tsx
import './lib/layers.css'; // Kigumi theme (first)
import './styles/theme.css'; // Your overrides (second)
```

## Choosing a Scale Value

Some practical values to try:

| Scale Value | Effect                                   |
| ----------- | ---------------------------------------- |
| `0`         | Sharp corners everywhere (no rounding)   |
| `0.5`       | Subtler, more restrained rounding        |
| `1`         | Default                                  |
| `1.5`       | Noticeably rounder                       |
| `2`         | Very round, soft appearance              |
| `3`         | Extremely round, approaching pill shapes |

Start with `1.5` or `2` and adjust from there. The scale is proportional, so all size relationships (small, medium, large) are preserved.

## Why Not Override Individual Tokens?

You could override `--wa-border-radius-s`, `--wa-border-radius-m`, and `--wa-border-radius-l` individually, but the scale token is better because:

- It is a single value to change.
- It maintains the proportional relationship between small, medium, and large radii.
- It automatically applies to every component that uses border radius tokens, including form controls (via `--wa-form-control-border-radius`) and panels (via `--wa-panel-border-radius`).

## Important Notes

- All custom CSS must go inside `@layer wa-theme-overrides` to ensure it takes priority over the base theme without needing `!important`.
- Never use `!important`. The 7-layer cascade system handles specificity.
- Never edit `layers.css` directly -- it gets overwritten when you run `npx kigumi init`.
- This works with all themes, palettes, and in both light and dark mode.
