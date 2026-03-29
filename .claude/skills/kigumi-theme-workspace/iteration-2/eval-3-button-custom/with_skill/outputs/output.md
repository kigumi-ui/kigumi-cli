# Customizing a Specific Button in Kigumi

## The Short Answer

Use `::part(base)` on the `wa-button` element inside the `@layer wa-theme-overrides` cascade layer. There are no `--wa-button-*` CSS tokens in Web Awesome. The `::part()` selector is the public styling API for individual component customization.

## How to Do It

### 1. Create a theme override file (or add to an existing one)

Create `src/styles/theme.css` (if you do not already have one):

```css
@layer wa-theme-overrides {
  wa-button::part(base) {
    background: #6d28d9;
    text-transform: uppercase;
  }
}
```

### 2. Import it after layers.css

In your entry point (e.g., `src/main.tsx`):

```tsx
import './lib/layers.css'; // Kigumi theme (must come first)
import './styles/theme.css'; // Your overrides (must come second)
```

That is all that is needed. Every `<wa-button>` (or its Kigumi wrapper `<Button>`) in the project will now render with a purple background and uppercase text.

## Scoping to a Single Button Instance

If you only want one specific button to look this way (not every button), scope the selector with a class:

```css
@layer wa-theme-overrides {
  wa-button.cta-button::part(base) {
    background: #6d28d9;
    text-transform: uppercase;
  }
}
```

Then apply the class in your JSX:

```tsx
<Button class="cta-button" variant="brand">
  Get Started
</Button>
```

Note: use `class`, not `className`, on `<wa-*>` web component elements.

## Polishing the Result

You will likely want to handle hover/active states and ensure the text color has sufficient contrast against the new background:

```css
@layer wa-theme-overrides {
  wa-button.cta-button::part(base) {
    background: #6d28d9;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  wa-button.cta-button::part(base):hover {
    background: color-mix(in oklab, #6d28d9, var(--wa-color-mix-hover));
  }

  wa-button.cta-button::part(base):active {
    background: color-mix(in oklab, #6d28d9, var(--wa-color-mix-active));
  }
}
```

The `--wa-color-mix-hover` and `--wa-color-mix-active` tokens are built-in WA tokens designed to darken any color by the system's standard hover/active amounts, so your button states stay consistent with the rest of the design system.

## Why This Works

Web Awesome uses a 7-layer CSS cascade. `@layer wa-theme-overrides` is the highest-priority layer, so your custom CSS always wins without needing `!important`. The `::part()` pseudo-element is the official way to reach into a web component's shadow DOM -- it is the public styling API that WA exposes for each component.

### Key Rules

- Always place custom CSS inside `@layer wa-theme-overrides`.
- Never use `!important`. If a style is not applying, check that your CSS is in the correct layer.
- There are no per-component tokens like `--wa-button-background`. Use `::part()` instead.
- Use `class` (not `className`) on `<wa-*>` elements.
- Use browser DevTools to inspect the component's shadow DOM and discover available `part` names (e.g., `base`, `label`, `prefix`, `suffix`, `caret`).
