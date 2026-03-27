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
- Theme customization and cascade layers
- Available themes (free vs pro)
- Component styling via `::part()`
- Scale token adjustments

## Quick Start

When a user asks about theming:

**User**: "How do I change the brand color to purple?"

**You should**:

1. Read their `kigumi.config.json` to see current theme settings
2. Explain how to update the `theme.brandColor` field to `"purple"`
3. Reference available brand colors from [available-themes.md](references/available-themes.md)
4. Explain that changes require running `npx kigumi init` to regenerate theme files
5. Mention that the brand color applies via the `.wa-brand-purple` class on `<html>`

## How It Works

### 1. Read Project Configuration

First, check the user's `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "tailspin",
    "palette": "vogue",
    "brandColor": "blue"
  }
}
```

### 2. Understand Theme Structure

Kigumi themes are built on Web Awesome and consist of three independent axes:

- **Theme**: Visual style (typography, spacing, rounding, shadows). Applied via `.wa-theme-{name}`. Default theme = no class.
- **Palette**: Color tuning (saturation, warmth). Applied via `.wa-palette-{name}`. Default palette = no class.
- **Brand color**: Primary accent hue. Applied via `.wa-brand-{color}`. Default = blue (no class).
- **Dark mode**: Toggled via `.wa-dark` class on `<html>`.

See [references/available-themes.md](references/available-themes.md) for full lists.

### 3. Cascade Layers

Web Awesome uses a 7-layer CSS cascade for specificity control. Layers are ordered from lowest to highest priority:

1. `wa-native` -- Browser reset / normalization
2. `wa-utilities` -- Utility classes
3. `wa-color-palette` -- Palette color scales (hue-step values)
4. `wa-color-variant` -- Brand and semantic variant mapping
5. `wa-theme` -- Theme token definitions (the bulk of tokens)
6. `wa-theme-dimension` -- Dimensional overrides
7. `wa-theme-overrides` -- User custom overrides (highest priority)

All custom CSS should go in `@layer wa-theme-overrides` to ensure it wins without `!important`.

### 4. Scale Architecture

WA uses scale tokens as global multipliers. Changing one value cascades proportionally to all tokens in that category:

| Scale Token                  | Default | Controls                             |
| ---------------------------- | ------- | ------------------------------------ |
| `--wa-font-size-scale`       | `1`     | All font sizes                       |
| `--wa-space-scale`           | `1`     | All spacing values                   |
| `--wa-border-radius-scale`   | `1`     | All border radii (0 = sharp corners) |
| `--wa-border-width-scale`    | `1`     | All border widths                    |
| `--wa-shadow-offset-x-scale` | `0`     | Shadow horizontal direction          |
| `--wa-shadow-offset-y-scale` | `1`     | Shadow vertical direction            |
| `--wa-shadow-blur-scale`     | `1`     | Shadow softness                      |
| `--wa-shadow-spread-scale`   | `-0.5`  | Shadow spread                        |

Example: `--wa-border-radius-scale: 0` makes every corner sharp. `--wa-space-scale: 1.5` increases all spacing by 50%.

### 5. Component Styling

Individual components are styled through two mechanisms:

1. **CSS custom properties** for shared tokens (`--wa-form-control-*`, `--wa-panel-*`, `--wa-tooltip-*`)
2. **`::part()` selectors** for targeting specific component internals

There are NO `--wa-button-*`, `--wa-input-*`, or `--wa-card-*` tokens. Style these components with `::part()`:

```css
@layer wa-theme-overrides {
  wa-button::part(base) {
    border-radius: 0;
    text-transform: uppercase;
  }

  wa-input::part(base) {
    background: var(--wa-color-surface-raised);
  }

  wa-card::part(header) {
    border-bottom: var(--wa-border-width-s) solid var(--wa-color-surface-border);
  }
}
```

### 6. CSS Variables

All theme customization uses CSS custom properties. Components reference these variables, allowing global changes without modifying component code.

**Token architecture:** Semantic tokens reference palette tokens via steps (e.g., `--wa-color-brand-fill-loud` references `--wa-color-brand-50`). Override at `:root` scope.

See [references/css-variables.md](references/css-variables.md) for the complete variable reference (174+ tokens).

### 7. Customization Levels

Users can customize themes at three levels:

**Level 1: Config-based (Recommended)**

- Modify `kigumi.config.json` (theme, palette, brandColor)
- Run `npx kigumi init` to regenerate theme files
- No manual CSS editing required

**Level 2: CSS Variable Overrides**

- Override CSS variables inside `@layer wa-theme-overrides`
- Use scale tokens for proportional changes
- Use `::part()` for component-specific styling

**Level 3: Custom Theme**

- Create entirely custom theme file
- Full control over all tokens
- Advanced use case

See [references/customization.md](references/customization.md) for detailed guides.

## Common Tasks

### Change Brand Color

Update `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "tailspin",
    "palette": "vogue",
    "brandColor": "purple"
  }
}
```

Then regenerate:

```bash
npx kigumi init
```

Available brand colors: `blue` (default), `red`, `orange`, `yellow`, `green`, `cyan`, `indigo`, `purple`, `pink`, `gray`

### Enable Dark Mode

Dark mode uses the `.wa-dark` class on `<html>`:

```tsx
const [dark, setDark] = useState(false);

useEffect(() => {
  document.documentElement.classList.toggle('wa-dark', dark);
}, [dark]);
```

The `.wa-dark` class triggers different CSS variable values defined in the theme. Use `.wa-light` to force light mode in a dark context, and `.wa-invert` for local color scheme inversion.

### Override Surface Colors

In `@layer wa-theme-overrides`:

```css
@layer wa-theme-overrides {
  :root {
    --wa-color-surface-default: #fafafa;
    --wa-color-surface-raised: #ffffff;
    --wa-color-surface-border: #e0e0e0;
  }

  .wa-dark {
    --wa-color-surface-default: #0a0a0a;
    --wa-color-surface-raised: #171717;
    --wa-color-surface-border: #333333;
  }
}
```

### Make Everything Sharp-Cornered

```css
@layer wa-theme-overrides {
  :root {
    --wa-border-radius-scale: 0;
  }
}
```

### Switch to Pro Theme

Pro themes require a Web Awesome Pro license.

Update `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "premium",
    "palette": "elegant",
    "brandColor": "indigo"
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
  layers.css          # Main theme file (imports WA CSS + theme)
```

The `layers.css` file is referenced in your project's entry point (e.g., `main.tsx`).

## Important Notes

- **Theme changes require rebuild**: After modifying `kigumi.config.json`, run `npx kigumi init` to regenerate theme files
- **CSS variables are scoped**: Use `:root` for global changes, `.wa-dark` for dark mode overrides
- **Use `@layer wa-theme-overrides`**: All custom CSS belongs in this cascade layer
- **No `--wa-button-*` tokens**: Style components via `::part()` selectors
- **Never use `!important`**: The 7-layer cascade system handles specificity. If styles aren't applying, check that your CSS is in `@layer wa-theme-overrides`.
- **Scale tokens are powerful**: One override cascades to all derived values

## Reference Files

For detailed information, see:

- [Available Themes](references/available-themes.md) -- Themes, palettes, brand colors, and their CSS classes
- [CSS Variables](references/css-variables.md) -- Complete reference of 174+ CSS custom properties with real default values
- [Customization Guide](references/customization.md) -- Step-by-step guides for all three customization levels

## Troubleshooting

**Theme not applying:**

- Ensure `layers.css` is imported in your entry point
- Check browser console for CSS import errors
- Verify `kigumi.config.json` has valid theme values

**Dark mode not working:**

- Confirm `.wa-dark` class (not `.dark`) is being toggled on `<html>` element
- Check if CSS variables have `.wa-dark` selectors defined
- Inspect element in DevTools to see active CSS variables

**Custom colors not showing:**

- CSS variable overrides must be inside `@layer wa-theme-overrides`
- Ensure custom CSS is loaded after theme files
- Never use `!important`. If it isn't working, check cascade layer placement.

**Component styling not working:**

- Use `::part()` selectors for individual component styling
- There are no `--wa-button-*`, `--wa-input-*`, or `--wa-card-*` tokens
- Inspect the component's shadow DOM to find available part names
