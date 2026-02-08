# Theme Customization Guide

Step-by-step guides for customizing Kigumi themes.

## Table of Contents

- [Quick Start](#quick-start)
- [Change Brand Color](#change-brand-color)
- [Implement Dark Mode](#implement-dark-mode)
- [Override CSS Variables](#override-css-variables)
- [Custom Color Palette](#custom-color-palette)
- [Modify Component Styles](#modify-component-styles)
- [Create Custom Theme](#create-custom-theme)

## Quick Start

### Prerequisites

Ensure you have:

- Initialized Kigumi in your project: `npx kigumi init`
- A `kigumi.config.json` file in your project root
- `src/lib/layers.css` generated and imported in your app

## Change Brand Color

**Goal**: Change the primary brand color from red to blue.

### Step 1: Update Configuration

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
    "brandColor": "blue" // Changed from "red"
  }
}
```

### Step 2: Regenerate Theme

```bash
npx kigumi init
```

This updates `src/lib/layers.css` with the new brand color.

### Step 3: Verify Changes

Check that components using `variant="brand"` now display in blue:

```tsx
import { Button } from '@/components/ui';

// This button will now be blue
<Button variant="brand">Click Me</Button>;
```

### Available Brand Colors

See [available-themes.md](available-themes.md) for the complete list.

## Implement Dark Mode

**Goal**: Add a dark mode toggle to your application.

### Step 1: Create Toggle Component

Create a theme toggle component:

```tsx
// src/components/ThemeToggle.tsx
import { useEffect, useState } from 'react';
import { Button, Icon } from '@/components/ui';

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Toggle the 'dark' class on <html>
    document.documentElement.classList.toggle('dark', darkMode);
    // Save preference
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <Button
      variant="neutral"
      appearance="outlined"
      onClick={() => setDarkMode(!darkMode)}
      aria-label="Toggle theme"
    >
      <Icon slot="start" name={darkMode ? 'sun' : 'moon'} />
      {darkMode ? 'Light' : 'Dark'} Mode
    </Button>
  );
}
```

### Step 2: Add to Layout

Include the toggle in your app layout:

```tsx
// src/App.tsx or src/layouts/RootLayout.tsx
import { ThemeToggle } from '@/components/ThemeToggle';

export function App() {
  return (
    <div>
      <header>
        <nav>
          {/* ... other nav items ... */}
          <ThemeToggle />
        </nav>
      </header>
      <main>{/* Your app content */}</main>
    </div>
  );
}
```

### Step 3: Verify Dark Mode

- Click the toggle button
- Verify the page switches between light and dark themes
- Check that preference persists on page reload

## Override CSS Variables

**Goal**: Customize specific colors without changing the entire theme.

### Step 1: Create Custom CSS File

Create `src/styles/custom-theme.css`:

```css
/* Custom theme overrides */

:root {
  /* Override brand color with a custom shade */
  --wa-color-brand: #0066cc;
  --wa-color-brand-hover: #0052a3;
  --wa-color-brand-active: #003d7a;

  /* Adjust border radius for rounder components */
  --wa-border-radius-small: 0.5rem;
  --wa-border-radius-medium: 0.75rem;
  --wa-border-radius-large: 1.25rem;

  /* Customize spacing */
  --wa-spacing-medium: 1.25rem;
  --wa-spacing-large: 2rem;
}

.dark {
  /* Dark mode overrides */
  --wa-color-brand: #4d9fff;
  --wa-color-brand-hover: #70b1ff;
  --wa-color-brand-active: #a3cbff;
}
```

### Step 2: Import Custom CSS

Import after your theme file in your entry point:

```tsx
// src/main.tsx or src/App.tsx
import './lib/layers.css'; // Kigumi theme (first)
import './styles/custom-theme.css'; // Your overrides (second)
```

**Order matters**: Your custom CSS must be imported after `layers.css` to override variables.

### Step 3: Verify Overrides

Inspect elements in DevTools to confirm your custom variables are being used.

## Custom Color Palette

**Goal**: Create a completely custom color palette.

### Step 1: Define Color Palette

Create `src/styles/palette.css`:

```css
:root {
  /* Background colors */
  --wa-color-background: #ffffff;
  --wa-color-background-secondary: #f8fafc;
  --wa-color-background-tertiary: #f1f5f9;

  /* Text colors */
  --wa-color-text: #0f172a;
  --wa-color-text-secondary: #475569;
  --wa-color-text-tertiary: #94a3b8;

  /* Border colors */
  --wa-color-border: #e2e8f0;
  --wa-color-border-hover: #cbd5e1;

  /* Semantic colors */
  --wa-color-brand: #8b5cf6;
  --wa-color-success: #10b981;
  --wa-color-warning: #f59e0b;
  --wa-color-danger: #ef4444;
  --wa-color-neutral: #64748b;
}

.dark {
  /* Dark mode palette */
  --wa-color-background: #0f172a;
  --wa-color-background-secondary: #1e293b;
  --wa-color-background-tertiary: #334155;

  --wa-color-text: #f8fafc;
  --wa-color-text-secondary: #cbd5e1;
  --wa-color-text-tertiary: #64748b;

  --wa-color-border: #334155;
  --wa-color-border-hover: #475569;

  --wa-color-brand: #a78bfa;
  --wa-color-success: #34d399;
  --wa-color-warning: #fbbf24;
  --wa-color-danger: #f87171;
  --wa-color-neutral: #94a3b8;
}
```

### Step 2: Import Palette

```tsx
// src/main.tsx
import './lib/layers.css';
import './styles/palette.css';
```

### Step 3: Test Across Components

Verify the custom palette works across all components:

```tsx
<Button variant="brand">Brand Button</Button>
<Button variant="success">Success Button</Button>
<Button variant="warning">Warning Button</Button>
<Button variant="danger">Danger Button</Button>
<Button variant="neutral">Neutral Button</Button>
```

## Modify Component Styles

**Goal**: Customize the appearance of specific components.

### Example: Custom Button Styles

Create `src/styles/custom-components.css`:

```css
/* Custom button styles */
:root {
  /* Make buttons taller */
  --wa-button-height-small: 2rem;
  --wa-button-height-medium: 2.75rem;
  --wa-button-height-large: 3.5rem;

  /* Add more padding */
  --wa-button-padding-horizontal: 1.5rem;

  /* Adjust border radius */
  --wa-button-border-radius: 0.5rem;

  /* Customize brand button */
  --wa-button-brand-background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 100%
  );
  --wa-button-brand-border: transparent;
}

/* Custom styles for specific button states */
wa-button[variant='brand']:hover {
  --wa-button-brand-background: linear-gradient(
    135deg,
    #5568d3 0%,
    #5f3a8a 100%
  );
  transform: translateY(-1px);
  transition: transform 0.2s;
}
```

### Example: Custom Card Styles

```css
:root {
  /* Add more shadow to cards */
  --wa-card-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  /* Increase border radius */
  --wa-card-radius: 1rem;

  /* Add subtle border */
  --wa-card-border: 1px solid var(--wa-color-border);
}

.dark {
  --wa-card-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
}
```

## Create Custom Theme

**Goal**: Build a completely custom theme from scratch.

### Step 1: Create Theme File

Create `src/styles/my-theme.css`:

```css
/* My Custom Theme */

/* Import Web Awesome base styles (required) */
@import '@awesome.me/webawesome/dist/themes/awesome/light.css' layer(theme);
@import '@awesome.me/webawesome/dist/themes/awesome/dark.css' layer(theme);

/* Define custom design tokens */
:root {
  /* Color Palette */
  --my-brand-50: #fef2f2;
  --my-brand-100: #fee2e2;
  --my-brand-500: #ef4444;
  --my-brand-600: #dc2626;
  --my-brand-700: #b91c1c;

  /* Map to Web Awesome variables */
  --wa-color-brand: var(--my-brand-500);
  --wa-color-brand-hover: var(--my-brand-600);
  --wa-color-brand-active: var(--my-brand-700);

  /* Typography */
  --wa-font-family: 'Inter', system-ui, sans-serif;
  --wa-font-family-mono: 'Fira Code', monospace;

  /* Spacing Scale (8px base) */
  --wa-spacing-xs: 0.5rem;
  --wa-spacing-small: 0.75rem;
  --wa-spacing-medium: 1rem;
  --wa-spacing-large: 1.5rem;
  --wa-spacing-xl: 2rem;

  /* Border Radius */
  --wa-border-radius-small: 0.375rem;
  --wa-border-radius-medium: 0.5rem;
  --wa-border-radius-large: 0.75rem;

  /* Shadows */
  --wa-shadow-small: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --wa-shadow-medium: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --wa-shadow-large: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.dark {
  /* Dark mode adjustments */
  --wa-color-brand: var(--my-brand-400);
  --wa-color-brand-hover: var(--my-brand-300);
  --wa-color-brand-active: var(--my-brand-200);
}
```

### Step 2: Load Custom Fonts

If using custom fonts, add to your `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code&display=swap"
  rel="stylesheet"
/>
```

### Step 3: Import Theme

Replace `layers.css` import with your custom theme:

```tsx
// src/main.tsx
import './styles/my-theme.css';
```

### Step 4: Document Your Theme

Create a theme documentation file for your team:

```markdown
# My Custom Theme

## Brand Colors

- Primary: #ef4444 (Red 500)
- Hover: #dc2626 (Red 600)
- Active: #b91c1c (Red 700)

## Typography

- Font Family: Inter
- Monospace: Fira Code

## Spacing Scale

8px base unit

## Usage

Import in entry file:

\`\`\`tsx
import './styles/my-theme.css';
\`\`\`
```

## Best Practices

### DO:

✅ Use CSS variables for customization (easier to maintain)
✅ Test in both light and dark modes
✅ Keep customizations in separate files from generated code
✅ Document your customizations for your team
✅ Use CSS layers to control specificity

### DON'T:

❌ Edit generated `layers.css` directly (will be overwritten)
❌ Hardcode values in components (use variables instead)
❌ Skip dark mode testing
❌ Use `!important` unless absolutely necessary
❌ Modify Web Awesome source files

## Troubleshooting

### Theme not applying

**Problem**: Custom CSS variables don't seem to work.

**Solutions**:

1. Check import order (custom CSS must come after `layers.css`)
2. Verify variable names (must start with `--wa-`)
3. Check selector specificity (use `:root` for globals)
4. Clear browser cache

### Dark mode colors wrong

**Problem**: Dark mode shows light mode colors.

**Solutions**:

1. Ensure `dark` class is on `<html>` element
2. Verify `.dark` selector in your CSS
3. Check that dark mode variables are defined
4. Inspect element in DevTools to see active variables

### Components look broken

**Problem**: Components have missing styles or look wrong.

**Solutions**:

1. Ensure Web Awesome CSS is imported
2. Check for CSS import errors in console
3. Verify `layers.css` exists and is generated
4. Run `npx kigumi init` to regenerate theme

---

**Documentation**: [kigumi.style](https://kigumi.style)
**Web Awesome Theming**: [webawesome.com/docs/theming](https://webawesome.com/docs/theming)
