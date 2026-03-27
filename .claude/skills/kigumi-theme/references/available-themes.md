# Available Themes

Complete reference of themes, palettes, and brand colors available in Kigumi via Web Awesome.

## Themes

Themes control the overall visual style: typography choices, spacing proportions, rounding, shadow style, and component aesthetics.

### Free Themes

| Theme      | Class                | Description                                                          |
| ---------- | -------------------- | -------------------------------------------------------------------- |
| `default`  | (no class needed)    | Clean, modern baseline. System fonts, balanced proportions.          |
| `awesome`  | `.wa-theme-awesome`  | Quicksand + Crimson Pro fonts, bright palette. Playful and friendly. |
| `shoelace` | `.wa-theme-shoelace` | Shoelace 2.x compatibility theme for migration.                      |

### Pro Themes (Web Awesome Pro license required)

| Theme       | Class                 | Description                                                    |
| ----------- | --------------------- | -------------------------------------------------------------- |
| `active`    | `.wa-theme-active`    | Bold, energetic aesthetic.                                     |
| `brutalist` | `.wa-theme-brutalist` | Raw, structural design language. Sharp corners, heavy borders. |
| `glossy`    | `.wa-theme-glossy`    | Polished, reflective surfaces. Premium feel.                   |
| `matter`    | `.wa-theme-matter`    | Material-inspired. Subtle elevation, clean lines.              |
| `mellow`    | `.wa-theme-mellow`    | Soft, warm, approachable. Rounded forms, gentle shadows.       |
| `playful`   | `.wa-theme-playful`   | Vibrant, fun, whimsical.                                       |
| `premium`   | `.wa-theme-premium`   | Refined, luxurious. Elegant typography and spacing.            |
| `tailspin`  | `.wa-theme-tailspin`  | Inter font, vogue palette. Modern utility aesthetic.           |

### Theme Activation

Themes are activated by class on the `<html>` element. The `default` theme is the baseline and requires no class.

```html
<!-- Default theme (no class needed) -->
<html>
  <!-- Named theme -->
  <html class="wa-theme-tailspin">
    <!-- Theme + dark mode -->
    <html class="wa-theme-tailspin wa-dark">
      <!-- Theme + palette + brand -->
      <html class="wa-theme-tailspin wa-palette-vogue wa-brand-purple"></html>
    </html>
  </html>
</html>
```

### Theme Selection in Kigumi

Set in `kigumi.config.json`:

```json
{
  "theme": {
    "selected": "tailspin"
  }
}
```

Then regenerate: `npx kigumi init`

## Palettes

Palettes define the color tuning for each hue: how saturated, warm, or cool the colors appear. Each palette provides the full 10-hue, 11-step color scale that themes reference.

| Palette       | Class                     | Description                                                    |
| ------------- | ------------------------- | -------------------------------------------------------------- |
| `default`     | (no class needed)         | Balanced, neutral tuning. Good general-purpose starting point. |
| `rudimentary` | `.wa-palette-rudimentary` | Muted, minimal saturation. Professional, understated.          |
| `bright`      | `.wa-palette-bright`      | Vivid, high-saturation colors. Eye-catching.                   |
| `elegant`     | `.wa-palette-elegant`     | Refined, slightly desaturated. Sophisticated feel.             |
| `mild`        | `.wa-palette-mild`        | Gentle, medium saturation. Balanced and approachable.          |
| `natural`     | `.wa-palette-natural`     | Earth-toned, organic feel. Warm and grounded.                  |
| `vogue`       | `.wa-palette-vogue`       | Fashion-forward, contemporary color balance.                   |
| `anodized`    | `.wa-palette-anodized`    | Metallic undertones, technical aesthetic.                      |

### Palette Selection

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary"
  }
}
```

The `default` palette is applied when no palette class is set. Named palettes use `.wa-palette-{name}`.

## Brand Colors

Brand color is the primary accent used throughout your application for:

- Primary buttons (`variant="brand"`)
- Active/checked states
- Focus indicators
- Links and interactive elements

### Available Brand Colors

| Color    | Class                      | Hues Used             |
| -------- | -------------------------- | --------------------- |
| `blue`   | (default, no class needed) | `--wa-color-blue-*`   |
| `red`    | `.wa-brand-red`            | `--wa-color-red-*`    |
| `orange` | `.wa-brand-orange`         | `--wa-color-orange-*` |
| `yellow` | `.wa-brand-yellow`         | `--wa-color-yellow-*` |
| `green`  | `.wa-brand-green`          | `--wa-color-green-*`  |
| `cyan`   | `.wa-brand-cyan`           | `--wa-color-cyan-*`   |
| `indigo` | `.wa-brand-indigo`         | `--wa-color-indigo-*` |
| `purple` | `.wa-brand-purple`         | `--wa-color-purple-*` |
| `pink`   | `.wa-brand-pink`           | `--wa-color-pink-*`   |
| `gray`   | `.wa-brand-gray`           | `--wa-color-gray-*`   |

Each brand color maps the full `--wa-color-brand-{step}` scale (05 through 95) to the corresponding hue scale. Blue is the default (no class needed).

### Brand Color Selection

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "rudimentary",
    "brandColor": "purple"
  }
}
```

## Semantic Variants

In addition to brand, WA provides 4 semantic color variants. Each has the same fill/border/on token structure:

| Variant   | Purpose                          | CSS Variables                                             |
| --------- | -------------------------------- | --------------------------------------------------------- |
| `brand`   | Primary actions, links, focus    | `--wa-color-brand-{fill,border,on}-{quiet,normal,loud}`   |
| `success` | Confirmations, completed actions | `--wa-color-success-{fill,border,on}-{quiet,normal,loud}` |
| `warning` | Cautions, alerts                 | `--wa-color-warning-{fill,border,on}-{quiet,normal,loud}` |
| `danger`  | Errors, destructive actions      | `--wa-color-danger-{fill,border,on}-{quiet,normal,loud}`  |
| `neutral` | Default buttons, inactive states | `--wa-color-neutral-{fill,border,on}-{quiet,normal,loud}` |

The underlying hue for success, warning, danger, and neutral is set at the `wa-color-variant` layer and is separate from brand color selection.

## Recommended Combinations

**Professional / B2B:**

```json
{
  "theme": {
    "selected": "default",
    "palette": "rudimentary",
    "brandColor": "blue"
  }
}
```

**SaaS Product:**

```json
{
  "theme": {
    "selected": "tailspin",
    "palette": "vogue",
    "brandColor": "indigo"
  }
}
```

**Marketing / Creative:**

```json
{
  "theme": {
    "selected": "awesome",
    "palette": "bright",
    "brandColor": "orange"
  }
}
```

**Documentation / Minimal:**

```json
{
  "theme": {
    "selected": "default",
    "palette": "default",
    "brandColor": "gray"
  }
}
```

## Dark Mode

All themes support dark mode via the `.wa-dark` class on `<html>`. No extra configuration needed.

```tsx
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('wa-dark', dark);
  }, [dark]);

  return (
    <wa-switch checked={dark} onInput={() => setDark(!dark)}>
      Dark mode
    </wa-switch>
  );
}
```

Mode classes:

- `.wa-dark` -- Activates dark mode
- `.wa-light` -- Forces light mode (useful inside a dark ancestor)
- `.wa-invert` -- Locally inverts the current mode

## Switching Themes

After modifying `kigumi.config.json`, regenerate theme files:

```bash
npx kigumi init
```

This will:

1. Update `src/lib/layers.css` with the correct theme/palette/brand imports
2. Apply the appropriate `.wa-theme-*`, `.wa-palette-*`, `.wa-brand-*` classes
3. Generate CSS custom properties for your selection

## Pro Themes

Pro themes require a Web Awesome Pro license. To use them:

1. Purchase [Web Awesome Pro](https://webawesome.com/pro)
2. Install pro package: `npm install @awesome.me/webawesome-pro`
3. Update `kigumi.config.json` to use a pro theme name
4. Run `npx kigumi init`

---

**Source:** Web Awesome 3.4.0 theme and palette CSS files
**Documentation:** [kigumi.style](https://kigumi.style) | [webawesome.com/themes](https://webawesome.com/themes)
