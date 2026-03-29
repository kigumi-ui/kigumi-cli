# Customizing a Specific Button Component

There are no `--wa-button-*` CSS tokens in Kigumi/Web Awesome. Individual component styling is done through **`::part()` selectors**, which target the component's internal shadow DOM parts.

## Changing Background and Adding Uppercase Text

Add this to your custom theme CSS file inside `@layer wa-theme-overrides`:

```css
/* src/styles/theme.css */
@layer wa-theme-overrides {
  wa-button::part(base) {
    background: var(--wa-color-brand-fill-loud);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
```

This targets all `<wa-button>` elements. The `base` part is the primary internal wrapper of the button component.

## Targeting Specific Button Variants

If you only want to change certain buttons, combine the `::part()` selector with attribute selectors:

```css
@layer wa-theme-overrides {
  /* Only brand/primary buttons */
  wa-button[variant='brand']::part(base) {
    background: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Only outline buttons */
  wa-button[variant='brand'][outline]::part(base) {
    background: transparent;
    text-transform: uppercase;
    border-color: #7c3aed;
    color: #7c3aed;
  }

  /* Only danger buttons */
  wa-button[variant='danger']::part(base) {
    text-transform: uppercase;
  }
}
```

## Targeting a Single Button Instance

If you need to style one specific button and not all buttons, use a CSS class:

```tsx
<wa-button class="hero-cta" variant="brand" size="large">
  Get Started
</wa-button>
```

```css
@layer wa-theme-overrides {
  wa-button.hero-cta::part(base) {
    background: linear-gradient(135deg, #7c3aed, #2563eb);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }
}
```

Note: use `class`, not `className`, on `<wa-*>` elements -- web components do not use React's `className` attribute.

## How to Apply

1. Create or edit `src/styles/theme.css`.
2. Wrap all overrides in `@layer wa-theme-overrides`.
3. Import it after `layers.css` in your entry point:

```tsx
// src/main.tsx
import './lib/layers.css'; // Kigumi theme (first)
import './styles/theme.css'; // Your overrides (second)
```

## Available Button Parts

To discover which parts a component exposes, inspect its shadow DOM in browser DevTools. For `wa-button`, the primary part is `base`, but you can also find parts like `label`, `prefix`, and `suffix` for more targeted styling:

```css
@layer wa-theme-overrides {
  /* Style just the label text inside the button */
  wa-button::part(label) {
    font-weight: 700;
  }

  /* Style the prefix icon area */
  wa-button::part(prefix) {
    margin-inline-end: var(--wa-space-xs);
  }
}
```

## Using Theme Tokens for the Background

Rather than hardcoding a color, prefer using CSS variables so your button adapts to theme and dark mode changes:

```css
@layer wa-theme-overrides {
  wa-button::part(base) {
    background: var(--wa-color-brand-fill-loud);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
```

`--wa-color-brand-fill-loud` resolves to the saturated brand color (e.g., `--wa-color-brand-50`) and automatically adjusts for dark mode and brand color selection.

## Important Notes

- There are no `--wa-button-*`, `--wa-input-*`, or `--wa-card-*` tokens. Always use `::part()` for component-specific styling.
- All custom CSS must be inside `@layer wa-theme-overrides`. Never use `!important`.
- Never edit `layers.css` directly -- it gets overwritten on `npx kigumi init`.
- Test your overrides in both light mode and dark mode (`.wa-dark`).
