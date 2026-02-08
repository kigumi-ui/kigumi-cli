# Available Themes

Complete reference of themes, palettes, and brand colors available in Kigumi.

## Themes

Kigumi offers two base themes built on Web Awesome:

| Theme     | Tier | Description                                                                | License Required |
| --------- | ---- | -------------------------------------------------------------------------- | ---------------- |
| `awesome` | Free | Clean, modern design system with comprehensive component coverage          | No               |
| `ocean`   | Pro  | Premium theme with refined aesthetics and additional customization options | Web Awesome Pro  |

### Theme Selection

Set in `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "awesome" // or "ocean"
  }
}
```

## Palettes

Each theme supports multiple color palettes that define the overall color approach:

| Palette       | Description                             | Use Case                                   |
| ------------- | --------------------------------------- | ------------------------------------------ |
| `rudimentary` | Minimal color usage, focus on neutrals  | Professional, B2B, documentation sites     |
| `expressive`  | Moderate color usage, balanced approach | General purpose, SaaS products             |
| `colorful`    | Rich color palette, vibrant appearance  | Creative, consumer-facing, marketing sites |

### Palette Selection

Set in `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary" // or "expressive" or "colorful"
  }
}
```

## Brand Colors

Brand color is the primary color used throughout your application for:

- Primary buttons (`variant="brand"`)
- Active states
- Focus indicators
- Links and interactive elements

### Available Brand Colors

| Color    | Hex Example | Common Use                        |
| -------- | ----------- | --------------------------------- |
| `red`    | #e63757     | Urgent, important, error contexts |
| `orange` | #f97316     | Warnings, attention, energy       |
| `yellow` | #eab308     | Highlights, warnings, optimism    |
| `green`  | #22c55e     | Success, confirmation, growth     |
| `blue`   | #3b82f6     | Trust, professional, technology   |
| `purple` | #a855f7     | Creative, luxury, innovation      |
| `gray`   | #6b7280     | Neutral, subtle, minimalist       |

### Brand Color Selection

Set in `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary",
    "brandColor": "blue"
  }
}
```

## Theme Combinations

### Recommended Combinations

**Professional / B2B:**

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary",
    "brandColor": "blue"
  }
}
```

**SaaS Product:**

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "expressive",
    "brandColor": "purple"
  }
}
```

**Marketing / Creative:**

```json
{
  "theme": {
    "selected": "ocean",
    "palette": "colorful",
    "brandColor": "orange"
  }
}
```

**Documentation:**

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary",
    "brandColor": "gray"
  }
}
```

## Switching Themes

After modifying `kigumi.config.json`, regenerate theme files:

```bash
npx kigumi init
```

This will:

1. Update `src/lib/layers.css` with new theme
2. Import required Web Awesome theme files
3. Generate CSS custom properties for your selection

## Pro Themes

### Ocean Theme

The `ocean` theme requires a Web Awesome Pro license. Features include:

- Enhanced visual design
- Additional palette options
- More granular customization
- Premium component variants

To use `ocean`:

1. Purchase [Web Awesome Pro](https://webawesome.com/pro)
2. Install pro package: `npm install @awesome.me/webawesome-pro`
3. Update `kigumi.config.json` to use `"selected": "ocean"`
4. Run `npx kigumi init`

## Dark Mode

All themes support dark mode automatically via CSS custom properties. Dark mode is enabled by toggling a `dark` class on the root `<html>` element.

Implementation example:

```tsx
import { useEffect, useState } from 'react';

export function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div>
      <button onClick={() => setDarkMode(!darkMode)}>
        Toggle {darkMode ? 'Light' : 'Dark'} Mode
      </button>
      {/* Your app content */}
    </div>
  );
}
```

Each theme and palette automatically provides appropriate dark mode values.

## Custom Themes

While Kigumi currently supports `awesome` and `ocean` themes, you can create custom themes by:

1. Defining your own CSS custom properties
2. Overriding Web Awesome variables in `layers.css`
3. Following the Web Awesome theming system

See [customization.md](customization.md) for detailed guides.

---

**Documentation**: [kigumi.style](https://kigumi.style)
**Web Awesome Themes**: [webawesome.com/themes](https://webawesome.com/themes)
