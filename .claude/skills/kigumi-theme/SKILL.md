---
name: kigumi-theme
description: >
  Customize Kigumi themes, CSS variables, design tokens, and dark mode.
  Use when the user asks about theming, colors, brand color, dark mode,
  light mode, CSS custom properties, --wa-* variables, layers.css,
  or component appearance customization.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Kigumi Theme Customization

Helps users customize Kigumi themes, CSS variables, design tokens, and appearance settings. Use this skill when users ask about:

- Changing theme colors or brand colors
- Dark mode / light mode setup
- CSS variables and design tokens
- Theme customization and layers
- Available themes (free vs pro)

## Quick Start

When a user asks about theming:

**User**: "How do I change the brand color to blue?"

**You should**:

1. Read their `kigumi.config.json` to see current theme settings
2. Explain how to update the `theme.brandColor` field
3. Reference available brand colors from [available-themes.md](references/available-themes.md)
4. Explain that changes require rebuilding components

## How It Works

### 1. Read Project Configuration

First, check the user's `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary",
    "brandColor": "red"
  }
}
```

### 2. Understand Theme Structure

Kigumi themes are built on Web Awesome and consist of:

- **Base theme**: `awesome` (free) or `ocean` (pro)
- **Palette**: Color system (`rudimentary`, `expressive`, `colorful`)
- **Brand color**: Primary color used throughout components
- **Dark mode**: Automatic via CSS custom properties

See [references/available-themes.md](references/available-themes.md) for details.

### 3. CSS Variables

All theme customization uses CSS custom properties (CSS variables). Components reference these variables, allowing global changes without modifying component code.

**Token architecture:** Semantic tokens reference other semantic tokens, not base tokens. The `--wa-` prefix is the token layer; override at `:root` scope.

See [references/css-variables.md](references/css-variables.md) for complete variable reference.

### 4. Customization Options

Users can customize themes at different levels:

**Level 1: Config-based (Recommended)**

- Modify `kigumi.config.json`
- Run `npx kigumi init` to regenerate theme files
- No manual CSS editing required

**Level 2: CSS Variables**

- Override CSS variables in `layers.css`
- Fine-grained control over specific properties
- Requires understanding of variable naming

**Level 3: Custom Theme**

- Create entirely custom theme files
- Full control but higher maintenance
- Advanced use case

See [references/customization.md](references/customization.md) for detailed guides.

## Common Tasks

### Change Brand Color

Update `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary",
    "brandColor": "blue"
  }
}
```

Then regenerate:

```bash
npx kigumi init
```

Available brand colors: red, orange, yellow, green, blue, purple, gray

### Enable Dark Mode

Dark mode is enabled by default via CSS custom properties. Users toggle it by adding/removing a class to the `<html>` element:

```tsx
// Add to root layout or App component
const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
  document.documentElement.classList.toggle('dark', darkMode);
}, [darkMode]);
```

The `dark` class triggers different CSS variable values defined in the theme.

### Override Specific Colors

In your project's global CSS (e.g., `app.css` or `layers.css`):

```css
:root {
  --wa-color-brand: #custom-color;
}

.dark {
  --wa-color-brand: #custom-dark-color;
}
```

### Switch to Pro Theme (Ocean)

Pro themes require a Web Awesome Pro license.

Update `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "ocean",
    "palette": "expressive",
    "brandColor": "blue"
  }
}
```

Then regenerate:

```bash
npx kigumi init
```

## Theme Files Location

After running `npx kigumi init`, theme files are generated in:

```
src/lib/
├── layers.css          # Main theme file
└── kigumi-theme.ts     # Theme configuration (if needed)
```

These files are referenced in your project's entry point (e.g., `main.tsx` or `App.tsx`).

## Important Notes

- **Theme changes require rebuild**: After modifying `kigumi.config.json`, run `npx kigumi init` to regenerate theme files
- **CSS variables are scoped**: Use `:root` for global changes, `.dark` for dark mode overrides
- **Pro themes**: `ocean` theme requires Web Awesome Pro license
- **Component-specific overrides**: Some components have their own CSS variables (e.g., `--wa-button-background`)
- **Never use `!important`**: If styles aren't applying, check CSS layer ordering in `layers.css`. The `@layer` cascade (base < theme) handles specificity automatically.

## Reference Files

For detailed information, see:

- [Available Themes](references/available-themes.md) - List of themes, palettes, and colors
- [CSS Variables](references/css-variables.md) - Complete CSS custom property reference
- [Customization Guide](references/customization.md) - Step-by-step customization examples

## Troubleshooting

**Theme not applying:**

- Ensure `layers.css` is imported in your entry point
- Check browser console for CSS import errors
- Verify `kigumi.config.json` has valid theme values

**Dark mode not working:**

- Confirm `dark` class is being toggled on `<html>` element
- Check if CSS variables have `.dark` selectors defined
- Inspect element in DevTools to see active CSS variables

**Custom colors not showing:**

- CSS variable overrides must be in `:root` or `.dark` selector
- Ensure custom CSS is loaded after theme files
- Never use `!important`. Check CSS layer ordering in `layers.css` instead — a specificity issue means the layers need adjustment, not a brute-force override.
