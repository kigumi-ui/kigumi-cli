---
name: kigumi-theme
description: >
  Customize Kigumi themes, CSS variables, design tokens, and dark mode.
  Use when the user asks about theming, colors, brand color, dark mode,
  light mode, CSS custom properties, --wa-* variables, layers.css,
  theme.css, overrides.css, or component appearance customization.
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

Kigumi generates `layers.css` in your styles directory (`src/styles/layers.css`, or `styles/layers.css` in a project without `src/`). It declares three cascade layers, ordered from lowest to highest priority:

```css
@layer base, theme, overrides;
@import '@awesome.me/webawesome/dist/styles/webawesome.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/themes/<theme>.css' layer(base);
@import '@awesome.me/webawesome/dist/styles/color/palettes/<palette>.css'
  layer(base);
@import './theme.css' layer(theme);
@import './overrides.css' layer(overrides);
```

| Layer       | Source                                          | Put here                                                             |
| ----------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| `base`      | Web Awesome styles + selected theme and palette | Nothing. Generated; do not edit.                                     |
| `theme`     | `theme.css` (yours)                             | Design tokens: `:root { --wa-*: ... }` and `.wa-dark { ... }` blocks |
| `overrides` | `overrides.css` (yours)                         | CSS rules no token expresses, such as `::part()` styling             |

Later layers beat earlier ones whatever the selector specificity, so a rule in `overrides.css` beats the same rule in `theme.css`, and both beat Web Awesome, without `!important`. Web Awesome's own eight internal layers (`wa-native` through `wa-theme-overrides`) all end up nested inside `base`, so you never need to write them.

Write plain CSS in both files. Do not wrap it in `@layer`: each file is already placed in its layer by the import. In particular, `@layer wa-theme-overrides { ... }` inside `theme.css` becomes a nested layer that loses to the unlayered rules in your own files, so it makes styles harder to apply, not easier.

`layers.css` is imported by the generated `kigumi.ts` (`src/lib/kigumi.ts` by default), not by your entry point. `theme.css` and `overrides.css` are created once and never overwritten. `kigumi init`, `theme`, `brand`, `palette` and `upgrade` create `overrides.css` when it is missing, and `upgrade` (or `init`, when it keeps your `layers.css`) adds the `overrides` layer to a `layers.css` written by an older CLI.

**Next.js Pages Router exception:** Next's Pages Router CSS pipeline drops an `@import` that carries `layer(...)`, so Kigumi writes these imports without it. Nothing lands in `base`, `theme` or `overrides`, and `overrides.css` beats `theme.css` only by coming later. A rule in `overrides.css` must be at least as specific as the rule it overrides. Pages Router projects import `@/styles/layers.css` and `@/lib/kigumi` from `pages/_app.tsx`, since Next only allows global CSS imports there.

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

Put these rules in `overrides.css`, as plain CSS:

```css
/* src/styles/overrides.css */
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
```

Select components by their tag (`wa-button::part(base)`): that works in React, Vue and Angular alike. Only the React wrappers also put a PascalCase class on the host (`<wa-button class="Button ...">`), so `.Button::part(base)` is React-only.

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

- Override CSS variables in `theme.css` (plain `:root` and `.wa-dark` blocks, no `@layer` wrapper)
- Use scale tokens for proportional changes
- Use `::part()` for component-specific styling in `overrides.css`

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

In `theme.css`:

```css
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
```

### Make Everything Sharp-Cornered

In `theme.css`:

```css
:root {
  --wa-border-radius-scale: 0;
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

After running `npx kigumi init`, these files exist (paths follow `stylesDir` and `utilsDir` in `kigumi.config.json`; a project without `src/` uses `styles/` and `lib/`):

```
src/styles/
  layers.css          # Generated: declares the layers, imports WA CSS, theme.css and overrides.css
  theme.css           # Yours: design tokens (created once, never overwritten)
  overrides.css       # Yours: custom CSS rules (created when missing, never overwritten)
src/lib/
  kigumi.ts           # Generated: imports layers.css and applies theme classes to <html>
```

`layers.css` is imported by the generated `kigumi.ts`, so you do not import it yourself. On the Next.js Pages Router, `pages/_app.tsx` imports `@/styles/layers.css` and `@/lib/kigumi` directly.

## Important Notes

- **Theme changes require rebuild**: After modifying `kigumi.config.json`, run `npx kigumi init` to regenerate theme files
- **CSS variables are scoped**: Use `:root` for global changes, `.wa-dark` for dark mode overrides
- **Tokens go in `theme.css`, rules go in `overrides.css`**: both as plain CSS, with no `@layer` wrapper. Never edit the generated `layers.css`
- **No `--wa-button-*` tokens**: Style components via `::part()` selectors
- **Never use `!important`**: The `base < theme < overrides` layers handle specificity. If styles aren't applying, check that tokens are in `theme.css`, rules are in `overrides.css`, and neither file is wrapped in `@layer`.
- **Scale tokens are powerful**: One override cascades to all derived values

## Reference Files

For detailed information, see:

- [Available Themes](references/available-themes.md) -- Themes, palettes, brand colors, and their CSS classes
- [CSS Variables](references/css-variables.md) -- Complete reference of 174+ CSS custom properties with real default values
- [Customization Guide](references/customization.md) -- Step-by-step guides for all three customization levels

## Troubleshooting

**Theme not applying:**

- Ensure the generated `kigumi.ts` is imported (it imports `layers.css`); on the Next.js Pages Router, `pages/_app.tsx` must import both `@/styles/layers.css` and `@/lib/kigumi`
- Check browser console for CSS import errors
- Verify `kigumi.config.json` has valid theme values

**Dark mode not working:**

- Confirm `.wa-dark` class (not `.dark`) is being toggled on `<html>` element
- Check if CSS variables have `.wa-dark` selectors defined
- Inspect element in DevTools to see active CSS variables

**Custom colors not showing:**

- Token overrides belong in `theme.css`, custom rules in `overrides.css`, both unwrapped (no `@layer`)
- Confirm `layers.css` still imports `./theme.css` and `./overrides.css`; `npx kigumi upgrade` adds a missing `overrides.css` import
- Next.js Pages Router: the layers are not applied there, so make the selector in `overrides.css` at least as specific as the rule you want to beat
- Never use `!important`. If it isn't working, check which file the CSS is in.

**Component styling not working:**

- Use `::part()` selectors for individual component styling
- There are no `--wa-button-*`, `--wa-input-*`, or `--wa-card-*` tokens
- Inspect the component's shadow DOM to find available part names
