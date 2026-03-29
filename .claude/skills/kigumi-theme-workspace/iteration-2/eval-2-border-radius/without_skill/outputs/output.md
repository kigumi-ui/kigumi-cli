# Making All Border Radii Larger in a Kigumi App

The easiest way to increase border radius across your entire app is to set a single CSS custom property in your `theme.css` file.

## The One-Line Solution

Open `src/styles/theme.css` and add:

```css
:root {
  --wa-border-radius-scale: 2;
}
```

That's it. Every component in your app will immediately use rounder corners.

## Why This Works

Web Awesome defines border radii using a scale multiplier. From the default theme:

```css
--wa-border-radius-scale: 1;
--wa-border-radius-s: calc(
  var(--wa-border-radius-scale) * 0.1875rem
); /* 3px  */
--wa-border-radius-m: calc(var(--wa-border-radius-scale) * 0.375rem); /* 6px  */
--wa-border-radius-l: calc(var(--wa-border-radius-scale) * 0.75rem); /* 12px */
```

All component-level tokens reference these three sizes:

```css
--wa-form-control-border-radius: var(
  --wa-border-radius-m
); /* inputs, selects */
--wa-panel-border-radius: var(--wa-border-radius-l); /* cards, dialogs  */
--wa-tooltip-border-radius: var(--wa-border-radius-s); /* tooltips        */
```

Changing `--wa-border-radius-scale` propagates through the whole chain. Setting it to `2` doubles every value. Setting it to `3` triples them.

Your `theme.css` sits in the `theme` cascade layer, which has higher priority than the `base` layer where Web Awesome defaults live, so your override always wins without needing `!important`.

## Scale Reference

| `--wa-border-radius-scale` | `-s` | `-m` | `-l` |
| -------------------------- | ---- | ---- | ---- |
| `1` (default)              | 3px  | 6px  | 12px |
| `2`                        | 6px  | 12px | 24px |
| `3`                        | 9px  | 18px | 36px |
| `4`                        | 12px | 24px | 48px |

## Going Even Rounder: Pill-Shaped Inputs

If you want inputs and buttons to be fully pill-shaped (like in Web Awesome's "Playful" theme), override the form control token specifically:

```css
:root {
  --wa-border-radius-scale: 2;
  --wa-form-control-border-radius: var(--wa-border-radius-pill);
}
```

`--wa-border-radius-pill` is always `9999px`, so inputs/buttons become fully rounded regardless of their height.

## Complete Example

Your final `src/styles/theme.css`:

```css
:root {
  /* Double all corner rounding globally */
  --wa-border-radius-scale: 2;

  /* Optional: make inputs/buttons pill-shaped */
  --wa-form-control-border-radius: var(--wa-border-radius-pill);
}
```

No build step needed. No component changes needed. The override is live as soon as the CSS loads.
