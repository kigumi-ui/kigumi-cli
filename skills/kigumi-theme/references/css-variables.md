# CSS Variables Reference

Complete reference of CSS custom properties (CSS variables) used in Kigumi themes.

## What are CSS Variables?

CSS variables (custom properties) allow you to store and reuse values throughout your stylesheet. Kigumi themes are built entirely on CSS variables, enabling:

- Global theme changes from one location
- Automatic dark mode support
- Component-level customization
- Runtime theming

## Variable Naming Convention

Web Awesome (and Kigumi) use the `--wa-` prefix for all theme variables:

```css
--wa-{category}-{property}-{variant}
```

Examples:

- `--wa-color-brand` - Brand color
- `--wa-spacing-medium` - Medium spacing unit
- `--wa-border-radius-large` - Large border radius

## Core Color Variables

### Brand Colors

| Variable                  | Description             | Default (Light) | Default (Dark)  |
| ------------------------- | ----------------------- | --------------- | --------------- |
| `--wa-color-brand`        | Primary brand color     | Based on config | Based on config |
| `--wa-color-brand-hover`  | Brand color on hover    | Darker shade    | Lighter shade   |
| `--wa-color-brand-active` | Brand color when active | Even darker     | Even lighter    |

### Semantic Colors

| Variable             | Description              | Use Case                          |
| -------------------- | ------------------------ | --------------------------------- |
| `--wa-color-success` | Success state color      | Confirmations, completed actions  |
| `--wa-color-warning` | Warning state color      | Cautions, alerts                  |
| `--wa-color-danger`  | Error/danger state color | Errors, destructive actions       |
| `--wa-color-neutral` | Neutral state color      | Default buttons, neutral elements |

### Background Colors

| Variable                          | Description          | Use Case                      |
| --------------------------------- | -------------------- | ----------------------------- |
| `--wa-color-background`           | Primary background   | Page background               |
| `--wa-color-background-secondary` | Secondary background | Cards, panels                 |
| `--wa-color-background-tertiary`  | Tertiary background  | Nested elements, hover states |

### Text Colors

| Variable                    | Description          | Use Case                    |
| --------------------------- | -------------------- | --------------------------- |
| `--wa-color-text`           | Primary text color   | Body text, headings         |
| `--wa-color-text-secondary` | Secondary text color | Captions, descriptions      |
| `--wa-color-text-tertiary`  | Tertiary text color  | Disabled text, placeholders |

### Border Colors

| Variable                  | Description           | Use Case                |
| ------------------------- | --------------------- | ----------------------- |
| `--wa-color-border`       | Default border color  | Dividers, input borders |
| `--wa-color-border-hover` | Border color on hover | Interactive elements    |
| `--wa-color-border-focus` | Border color on focus | Form inputs, buttons    |

## Spacing Variables

| Variable              | Description             | Typical Value  |
| --------------------- | ----------------------- | -------------- |
| `--wa-spacing-3xs`    | Extra extra small       | 0.125rem (2px) |
| `--wa-spacing-2xs`    | Extra small             | 0.25rem (4px)  |
| `--wa-spacing-xs`     | Small                   | 0.5rem (8px)   |
| `--wa-spacing-small`  | Small                   | 0.75rem (12px) |
| `--wa-spacing-medium` | Medium                  | 1rem (16px)    |
| `--wa-spacing-large`  | Large                   | 1.5rem (24px)  |
| `--wa-spacing-xl`     | Extra large             | 2rem (32px)    |
| `--wa-spacing-2xl`    | Extra extra large       | 3rem (48px)    |
| `--wa-spacing-3xl`    | Extra extra extra large | 4rem (64px)    |

## Typography Variables

### Font Families

| Variable                | Description    | Default              |
| ----------------------- | -------------- | -------------------- |
| `--wa-font-family`      | Default font   | System font stack    |
| `--wa-font-family-mono` | Monospace font | Monospace font stack |

### Font Sizes

| Variable                | Description       | Typical Value   |
| ----------------------- | ----------------- | --------------- |
| `--wa-font-size-xs`     | Extra small       | 0.75rem (12px)  |
| `--wa-font-size-small`  | Small             | 0.875rem (14px) |
| `--wa-font-size-medium` | Medium            | 1rem (16px)     |
| `--wa-font-size-large`  | Large             | 1.25rem (20px)  |
| `--wa-font-size-xl`     | Extra large       | 1.5rem (24px)   |
| `--wa-font-size-2xl`    | Extra extra large | 2rem (32px)     |

### Font Weights

| Variable                    | Description     | Typical Value |
| --------------------------- | --------------- | ------------- |
| `--wa-font-weight-light`    | Light weight    | 300           |
| `--wa-font-weight-normal`   | Normal weight   | 400           |
| `--wa-font-weight-medium`   | Medium weight   | 500           |
| `--wa-font-weight-semibold` | Semibold weight | 600           |
| `--wa-font-weight-bold`     | Bold weight     | 700           |

## Border Radius Variables

| Variable                    | Description   | Typical Value |
| --------------------------- | ------------- | ------------- |
| `--wa-border-radius-small`  | Small radius  | 0.25rem (4px) |
| `--wa-border-radius-medium` | Medium radius | 0.5rem (8px)  |
| `--wa-border-radius-large`  | Large radius  | 1rem (16px)   |
| `--wa-border-radius-pill`   | Pill shape    | 9999px        |
| `--wa-border-radius-circle` | Circle shape  | 50%           |

## Shadow Variables

| Variable             | Description        | Use Case                   |
| -------------------- | ------------------ | -------------------------- |
| `--wa-shadow-xs`     | Extra small shadow | Subtle depth               |
| `--wa-shadow-small`  | Small shadow       | Cards, panels              |
| `--wa-shadow-medium` | Medium shadow      | Dialogs, dropdowns         |
| `--wa-shadow-large`  | Large shadow       | Modals, prominent elements |
| `--wa-shadow-xl`     | Extra large shadow | Full-screen overlays       |

## Component-Specific Variables

### Button Variables

| Variable                    | Description             |
| --------------------------- | ----------------------- |
| `--wa-button-background`    | Button background color |
| `--wa-button-border`        | Button border color     |
| `--wa-button-text`          | Button text color       |
| `--wa-button-height-small`  | Small button height     |
| `--wa-button-height-medium` | Medium button height    |
| `--wa-button-height-large`  | Large button height     |

### Input Variables

| Variable                   | Description                 |
| -------------------------- | --------------------------- |
| `--wa-input-background`    | Input background color      |
| `--wa-input-border`        | Input border color          |
| `--wa-input-border-focus`  | Input border color on focus |
| `--wa-input-text`          | Input text color            |
| `--wa-input-placeholder`   | Placeholder text color      |
| `--wa-input-height-small`  | Small input height          |
| `--wa-input-height-medium` | Medium input height         |
| `--wa-input-height-large`  | Large input height          |

### Card Variables

| Variable               | Description           |
| ---------------------- | --------------------- |
| `--wa-card-background` | Card background color |
| `--wa-card-border`     | Card border color     |
| `--wa-card-shadow`     | Card shadow           |
| `--wa-card-radius`     | Card border radius    |

## Customization Examples

### Override Brand Color

```css
:root {
  --wa-color-brand: #0066cc;
}

.dark {
  --wa-color-brand: #4d9fff;
}
```

### Adjust Spacing Scale

```css
:root {
  --wa-spacing-small: 0.5rem;
  --wa-spacing-medium: 1rem;
  --wa-spacing-large: 2rem;
}
```

### Custom Border Radius

```css
:root {
  --wa-border-radius-small: 2px;
  --wa-border-radius-medium: 4px;
  --wa-border-radius-large: 8px;
}
```

### Modify Button Appearance

```css
:root {
  --wa-button-background: var(--wa-color-brand);
  --wa-button-border: var(--wa-color-brand);
  --wa-button-text: white;
  --wa-button-height-medium: 2.5rem;
}
```

## Dark Mode Variables

Dark mode is enabled by adding the `dark` class to the `<html>` element. Define dark mode values using the `.dark` selector:

```css
:root {
  --wa-color-background: white;
  --wa-color-text: black;
}

.dark {
  --wa-color-background: #0f172a;
  --wa-color-text: white;
}
```

Web Awesome themes automatically provide comprehensive dark mode variable definitions.

## Best Practices

### DO:

✅ Override variables in `:root` or `.dark` selectors
✅ Use semantic variables (`--wa-color-brand`) instead of hardcoded values
✅ Test changes in both light and dark modes
✅ Keep customizations in a centralized file (e.g., `custom-theme.css`)

### DON'T:

❌ Hardcode color values in components
❌ Use `!important` unless absolutely necessary
❌ Override variables in component-specific selectors (causes specificity issues)
❌ Modify Web Awesome source files directly

## Inspecting Variables

Use browser DevTools to inspect active CSS variables:

1. Right-click element → Inspect
2. Go to Computed tab
3. Scroll to bottom to see all CSS variables
4. Filter by `--wa-` prefix

You can also see variable definitions in the Elements tab under the Styles panel.

---

**Documentation**: [kigumi.style](https://kigumi.style)
**Web Awesome CSS Variables**: [webawesome.com/docs/theming](https://webawesome.com/docs/theming)
