# Web Awesome Theme System - Reference

**Purpose:** Understand how Web Awesome themes work (REQUIRED reading for theme tasks)

---

## Core Concept

Web Awesome uses a **two-part system** for themes:

1. **CSS Import** - Provides the design tokens
2. **HTML Classes** - Activates those tokens

**Both are required.** Importing CSS without setting classes does nothing.

---

## How to Apply a Theme

### Step 1: Import Theme CSS

```typescript
// For specific themes:
import '@awesome.me/webawesome/dist/styles/themes/default.css';
import '@awesome.me/webawesome/dist/styles/themes/dark.css';

// Base styles (NOT a theme):
import '@awesome.me/webawesome/dist/styles/webawesome.css'; // ❌ Don't use this
```

### Step 2: Set HTML Classes

```html
<html class="wa-theme-{theme} wa-palette-{palette} wa-brand-{color}">
```

**Example:**
```html
<html class="wa-theme-dark wa-palette-default wa-brand-purple">
```

### Step 3 (Optional): Custom Overrides

```css
/* src/styles/theme.css */
:root {
  --wa-space-m: 1.5rem;  /* Override spacing */
  --wa-color-brand-fill-loud: #ff00ff;  /* Custom brand color */
}
```

Import after theme CSS:
```typescript
import '@awesome.me/webawesome/dist/styles/themes/dark.css';
import '@/styles/theme.css';  // Your overrides
```

---

## The Three Components

### 1. Theme

Controls overall design (colors, spacing, typography, etc.)

**Available:**
- `default` (Light theme) - Free
- `dark` (Dark theme) - Free
- `none` (No theme, just components) - Free
- Additional Pro themes

**Class:** `wa-theme-{name}`

### 2. Color Palette

Defines 10 color hues with 11 tints each.

**Hues:** red, orange, yellow, green, cyan, blue, indigo, purple, pink, gray
**Tints:** 95, 90, 80, 70, 60, 50, 40, 30, 20, 10, 05 (lightest to darkest)

**Available:**
- `default` - Free
- Additional Pro palettes

**Class:** `wa-palette-{name}`

**Usage:**
```css
color: var(--wa-color-blue-70);     /* Specific color from palette */
background: var(--wa-color-gray-95); /* Light gray */
```

### 3. Brand Color

Maps one palette color to the `brand` semantic scale.

**Available:** blue, purple, green, red, orange, yellow, cyan, indigo, pink, gray

**Class:** `wa-brand-{color}`

**Effect:**
```css
/* With wa-brand-purple: */
--wa-color-brand-50 → --wa-color-purple-50
--wa-color-brand-fill-loud → purple color
```

---

## Design Tokens

### Color Scales (From Palettes)

**Format:** `--wa-color-{hue}-{tint}`

```css
--wa-color-red-70
--wa-color-blue-50
--wa-color-gray-95
```

### Semantic Scales

**Format:** `--wa-color-{group}-{tint}`

**Groups:** brand, neutral, success, warning, danger

```css
--wa-color-brand-70    /* Uses brand color */
--wa-color-success-50  /* Green (typically) */
--wa-color-danger-80   /* Red (typically) */
```

### Semantic Colors (Most Common)

**Format:** `--wa-color-{group}-{role}-{attention}`

**Roles:** fill, border, text, on
**Attention:** quiet, normal, loud

```css
/* Brand button background */
background: var(--wa-color-brand-fill-loud);
/* Text on brand button */
color: var(--wa-color-brand-on-loud);
/* Subtle border */
border-color: var(--wa-color-neutral-border-quiet);
```

### Foundational Colors

```css
/* Surfaces */
--wa-color-surface-default  /* Main background */
--wa-color-surface-raised   /* Dialogs, menus */
--wa-color-surface-lowered  /* Wells, insets */
--wa-color-surface-border   /* Borders */

/* Text */
--wa-color-text-normal      /* Body text */
--wa-color-text-quiet       /* Subtle text */
--wa-color-text-link        /* Links */

/* Interactions */
--wa-color-focus           /* Focus outline */
--wa-color-mix-hover       /* Hover overlay */
--wa-color-mix-active      /* Active/pressed overlay */
```

### Other Tokens

```css
/* Spacing */
--wa-space-xs, --wa-space-s, --wa-space-m, --wa-space-l, --wa-space-xl

/* Typography */
--wa-font-size-s, --wa-font-size-m, --wa-font-size-l
--wa-font-weight-normal, --wa-font-weight-bold

/* Borders */
--wa-border-radius-s, --wa-border-radius-m, --wa-border-radius-l

/* Shadows */
--wa-shadow-s, --wa-shadow-m, --wa-shadow-l
```

---

## Common Patterns

### Button with Brand Color

```tsx
<Button variant="brand" appearance="filled">
  Submit
</Button>
```

Uses:
- `--wa-color-brand-fill-loud` (background)
- `--wa-color-brand-on-loud` (text)
- Changes when `wa-brand-{color}` class changes

### Accessible Color Contrast

Tint differences ensure WCAG compliance:

- **Difference of 40** = 3:1 contrast (AA for large text)
- **Difference of 50** = 4.5:1 contrast (AA for normal text)
- **Difference of 60** = 7:1 contrast (AAA)

```css
/* Good: 60 tint difference */
background: var(--wa-color-brand-10);
color: var(--wa-color-brand-70);

/* Bad: Only 10 tint difference */
background: var(--wa-color-brand-50);
color: var(--wa-color-brand-60); /* ❌ Poor contrast */
```

---

## Runtime Class Management

Since we generate `webawesome.ts` at build time, we set classes at runtime:

```typescript
if (typeof document !== 'undefined') {
  const html = document.documentElement;

  // Remove old classes (for theme switching)
  html.className = html.className
    .replace(/\bwa-theme-\S+/g, '')
    .replace(/\bwa-palette-\S+/g, '')
    .replace(/\bwa-brand-\S+/g, '');

  // Add new classes
  html.classList.add('wa-theme-default');
  html.classList.add('wa-palette-default');
  html.classList.add('wa-brand-blue');
}
```

---

## Common Mistakes

### ❌ Wrong: Importing Base Styles

```typescript
import '@awesome.me/webawesome/dist/styles/webawesome.css';
```

This provides component styles but NO theme tokens.

### ✅ Correct: Import Theme

```typescript
import '@awesome.me/webawesome/dist/styles/themes/default.css';
```

### ❌ Wrong: No HTML Classes

```html
<html lang="en">
```

Theme CSS imported but not activated.

### ✅ Correct: With Classes

```html
<html lang="en" class="wa-theme-default wa-palette-default wa-brand-blue">
```

### ❌ Wrong: Only One Class

```html
<html class="wa-theme-dark">
```

Missing palette and brand classes. Theme won't work fully.

### ✅ Correct: All Three Classes

```html
<html class="wa-theme-dark wa-palette-default wa-brand-purple">
```

---

## Testing Themes

### Visual Inspection

1. Open browser DevTools
2. Inspect `<html>` element
3. Verify all three classes present
4. Check Computed styles for `--wa-color-brand-fill-loud`
5. Verify it matches expected brand color

### Testing Brand Colors

Change the `wa-brand-{color}` class:
- Buttons should change color
- Brand semantic tokens should update
- All brand UI elements should reflect new color

### Testing Palettes

Change the `wa-palette-{name}` class:
- All color tints should shift
- Overall color mood should change
- Contrast should remain accessible

---

## For Kigumi CLI

**What We Generate:**

1. **Config:** Store theme, palette, brandColor in `kigumi-components.json`
2. **Import:** Generate correct CSS import in `webawesome.ts`
3. **Classes:** Generate runtime script to set HTML classes
4. **Overrides:** Create `src/styles/theme.css` for user customization

**Current Bug:**
- We import CSS but DON'T set classes
- Result: Themes are loaded but inactive

**Fix:**
- Add runtime script to `webawesome.ts` that sets all three classes
- Use values from config, not hardcoded

---

## References

- Web Awesome Themes: `webawesome-docs/themes.njk`
- Color Palettes: `webawesome-docs/color-palettes.njk`
- Design Tokens: `webawesome-docs/tokens/color.md`
- All Tokens: `webawesome-docs/tokens/`

---

## Quick Lookup

**Need to know:** What classes to set?
```html
<html class="wa-theme-{theme} wa-palette-{palette} wa-brand-{color}">
```

**Need to know:** What CSS to import?
```typescript
import '@awesome.me/webawesome/dist/styles/themes/{theme}.css';
```

**Need to know:** How to override tokens?
```css
/* src/styles/theme.css */
:root {
  --wa-{token-name}: {value};
}
```

**Need to know:** Available brand colors?
```
blue, purple, green, red, orange, yellow, cyan, indigo, pink, gray
```
