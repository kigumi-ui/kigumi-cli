---
name: generate-kigumi-theme-preset
description: Create, modify, and validate theme presets for Kigumi Studio. Use when the user wants to design a new theme, adjust an existing preset, or needs help with Web Awesome design tokens and color palettes.
---

# Generate Kigumi Theme Preset

This skill guides you through creating, modifying, and validating theme presets for Kigumi Studio - the visual theme builder for Web Awesome CSS custom properties.

## When to Use

Use this skill when the user:

- Wants to create a new theme preset (e.g., "create a warm sunset theme")
- Asks to modify an existing preset (e.g., "make ocean breeze warmer")
- Needs help with design tokens or color palettes
- Wants to validate a theme (contrast, consistency)
- Mentions Kigumi Studio themes, presets, or Web Awesome tokens
- Provides a mood/style description for a theme

## Quick Start Workflow

```
1. [ ] Understand requirements (mood/style OR reference preset + changes)
2. [ ] Read design token reference (property-definitions.ts)
3. [ ] Develop color palette (brand → surface → text → semantic)
4. [ ] Choose typography (from Bunny Fonts)
5. [ ] Configure spacing, borders, shadows
6. [ ] Derive dark mode variant
7. [ ] Generate JSON preset file (themes/{name}.json) + optional companion CSS
8. [ ] Validate (contrast checks, token consistency, preset-schema.test.ts)
9. [ ] Provide preview instructions
```

## Studio Token System (43 Properties)

Kigumi Studio supports 43 Web Awesome design tokens organized in 15 groups. These are the ONLY tokens editable in the Studio UI:

### Colors - Brand (1 property)

| CSS Variable       | Default (Light) | Default (Dark) | Input | Range | Description                              |
| ------------------ | --------------- | -------------- | ----- | ----- | ---------------------------------------- |
| `--wa-color-brand` | `#0071ec`       | `#0071ec`      | color | -     | Primary brand color (NOT mode-dependent) |

### Colors - Surface (4 properties)

| CSS Variable                 | Default (Light) | Default (Dark) | Input | Description                         |
| ---------------------------- | --------------- | -------------- | ----- | ----------------------------------- |
| `--wa-color-surface-raised`  | `#ffffff`       | `#1b1d26`      | color | Elevated surfaces (cards, popovers) |
| `--wa-color-surface-default` | `#ffffff`       | `#101219`      | color | Default page background             |
| `--wa-color-surface-lowered` | `#f1f2f3`       | `#0a0b10`      | color | Recessed surfaces (code blocks)     |
| `--wa-color-surface-border`  | `#e4e5e9`       | `#2f323f`      | color | Border color for surfaces           |

**Hierarchy Rule:** raised (lightest) > default > lowered (darkest) in light mode, INVERTED in dark mode.

### Colors - Text (3 properties)

| CSS Variable             | Default (Light) | Default (Dark) | Input | Description          |
| ------------------------ | --------------- | -------------- | ----- | -------------------- |
| `--wa-color-text-normal` | `#1b1d26`       | `#f1f2f3`      | color | Primary text color   |
| `--wa-color-text-quiet`  | `#545868`       | `#9194a2`      | color | Secondary/muted text |
| `--wa-color-text-link`   | `#0053c0`       | `#6eb3ff`      | color | Link text color      |

**Contrast Rule:** `text-normal` vs `surface-default` must be >= 4.5:1 (WCAG AA), `text-quiet` >= 3:1.

### Colors - Semantic (4 properties)

| CSS Variable         | Default (Light) | Default (Dark) | Input | Description                            |
| -------------------- | --------------- | -------------- | ----- | -------------------------------------- |
| `--wa-color-success` | `#16a34a`       | `#16a34a`      | color | Base color for success states          |
| `--wa-color-warning` | `#d97706`       | `#d97706`      | color | Base color for warning states          |
| `--wa-color-danger`  | `#dc2626`       | `#dc2626`      | color | Base color for danger/error states     |
| `--wa-color-neutral` | `#6b7280`       | `#6b7280`      | color | Base color for neutral/inactive states |

**Note:** Semantic colors are NOT mode-dependent. Only change if thematically necessary.

### Typography - Families (4 properties)

| CSS Variable                | Default                                | Input  | Options               |
| --------------------------- | -------------------------------------- | ------ | --------------------- |
| `--wa-font-family-body`     | `ui-sans-serif, system-ui, sans-serif` | select | See Bunny Fonts below |
| `--wa-font-family-heading`  | `ui-sans-serif, system-ui, sans-serif` | select | See Bunny Fonts below |
| `--wa-font-family-code`     | `ui-monospace, monospace`              | select | See Bunny Fonts below |
| `--wa-font-family-longform` | `ui-serif, serif`                      | select | See Bunny Fonts below |

**Font Value Format:** `'Font Name', ui-sans-serif, system-ui, sans-serif` (with single quotes around font name).

### Typography - Weights (4 properties)

| CSS Variable                | Default | Input  | Range   |
| --------------------------- | ------- | ------ | ------- |
| `--wa-font-weight-light`    | `300`   | select | 100-900 |
| `--wa-font-weight-normal`   | `400`   | select | 100-900 |
| `--wa-font-weight-semibold` | `500`   | select | 100-900 |
| `--wa-font-weight-bold`     | `700`   | select | 100-900 |

### Typography - Size Scale (1 property)

| CSS Variable           | Default | Input  | Range                | Description                 |
| ---------------------- | ------- | ------ | -------------------- | --------------------------- |
| `--wa-font-size-scale` | `1`     | slider | 0.75-1.5 (step 0.05) | Global font size multiplier |

### Typography - Line Heights (3 properties)

| CSS Variable                 | Default | Input  | Range          | Description     |
| ---------------------------- | ------- | ------ | -------------- | --------------- |
| `--wa-line-height-condensed` | `1.2`   | slider | 1-3 (step 0.1) | For headings    |
| `--wa-line-height-normal`    | `1.6`   | slider | 1-3 (step 0.1) | For body text   |
| `--wa-line-height-expanded`  | `2`     | slider | 1-3 (step 0.1) | For readability |

### Spacing (1 property)

| CSS Variable       | Default | Input  | Range            | Description               |
| ------------------ | ------- | ------ | ---------------- | ------------------------- |
| `--wa-space-scale` | `1`     | slider | 0.5-2 (step 0.1) | Global spacing multiplier |

### Border Radius (1 property)

| CSS Variable               | Default | Input  | Range          | Description                                                      |
| -------------------------- | ------- | ------ | -------------- | ---------------------------------------------------------------- |
| `--wa-border-radius-scale` | `1`     | slider | 0-3 (step 0.1) | Global border radius multiplier (0=sharp, 1=default, 2+=rounded) |

### Border Width & Style (2 properties)

| CSS Variable              | Default | Input  | Options                                            |
| ------------------------- | ------- | ------ | -------------------------------------------------- |
| `--wa-border-width-scale` | `1`     | slider | 0-3 (step 0.1)                                     |
| `--wa-border-style`       | `solid` | select | solid, dashed, dotted, double, groove, ridge, none |

### Shadows (6 properties)

| CSS Variable                 | Default (Light) | Default (Dark) | Input  | Range              | Description                        |
| ---------------------------- | --------------- | -------------- | ------ | ------------------ | ---------------------------------- |
| `--wa-color-shadow`          | `#000000`       | `#000000`      | color  | -                  | Shadow base color (hex)            |
| `--wa-shadow-opacity`        | `0.2`           | `0.5`          | slider | 0-1 (step 0.05)    | Shadow transparency                |
| `--wa-shadow-offset-x-scale` | `0`             | `0`            | slider | -2 to 2 (step 0.1) | Horizontal offset multiplier       |
| `--wa-shadow-offset-y-scale` | `1`             | `1`            | slider | -2 to 2 (step 0.1) | Vertical offset multiplier         |
| `--wa-shadow-blur-scale`     | `1`             | `1`            | slider | 0-5 (step 0.1)     | Blur radius multiplier             |
| `--wa-shadow-spread-scale`   | `-0.5`          | `-0.5`         | slider | -2 to 2 (step 0.1) | Spread multiplier (negative=inset) |

**CRITICAL:** In preset JSON, use `"--wa-color-shadow": "#hex"` and `"--wa-shadow-opacity": "0.x"` as separate properties. The `css-generator.ts` will combine them to `rgb(r g b / opacity)` format on CSS export.

### Form Controls (4 properties)

| CSS Variable                          | Default (Light)          | Default (Dark)           | Input  | Description                 |
| ------------------------------------- | ------------------------ | ------------------------ | ------ | --------------------------- |
| `--wa-form-control-background-color`  | `#ffffff`                | `#101219`                | color  | Input background            |
| `--wa-form-control-border-color`      | `#9194a2`                | `#545868`                | color  | Input border                |
| `--wa-form-control-border-style`      | `var(--wa-border-style)` | `var(--wa-border-style)` | select | inherit or solid/dashed/etc |
| `--wa-form-control-placeholder-color` | `#717584`                | `#717584`                | color  | Placeholder text            |

### Focus Ring (1 property)

| CSS Variable            | Default | Input  | Options                       |
| ----------------------- | ------- | ------ | ----------------------------- |
| `--wa-focus-ring-style` | `solid` | select | solid, dashed, dotted, double |

### Transitions (4 properties)

| CSS Variable             | Default | Input  | Range                                        | Unit |
| ------------------------ | ------- | ------ | -------------------------------------------- | ---- |
| `--wa-transition-fast`   | `75`    | slider | 0-1000 (step 25)                             | ms   |
| `--wa-transition-normal` | `150`   | slider | 0-1000 (step 25)                             | ms   |
| `--wa-transition-slow`   | `300`   | slider | 0-1000 (step 25)                             | ms   |
| `--wa-transition-easing` | `ease`  | select | ease, ease-in, ease-out, ease-in-out, linear |

## Bunny Fonts Reference

**System Defaults (3):**

- `ui-sans-serif, system-ui, sans-serif` (OS Default sans)
- `ui-serif, serif` (OS Default serif)
- `ui-monospace, monospace` (OS Default mono)

**Sans-Serif (11):**

- `'Inter', ui-sans-serif, system-ui, sans-serif` (versatile, modern)
- `'Poppins', ui-sans-serif, system-ui, sans-serif` (geometric, friendly)
- `'Manrope', ui-sans-serif, system-ui, sans-serif` (balanced, clean)
- `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif` (elegant, contemporary)
- `'Montserrat', ui-sans-serif, system-ui, sans-serif` (geometric, urban)
- `'Source Sans 3', ui-sans-serif, system-ui, sans-serif` (highly readable)
- `'DM Sans', ui-sans-serif, system-ui, sans-serif` (low contrast, geometric)
- `'Space Grotesk', ui-sans-serif, system-ui, sans-serif` (playful, space-age)
- `'Figtree', ui-sans-serif, system-ui, sans-serif` (warm, friendly)
- `'Mulish', ui-sans-serif, system-ui, sans-serif` (minimalist)
- `'Nunito', ui-sans-serif, system-ui, sans-serif` (rounded, soft)

**Serif (8):**

- `'Playfair Display', ui-serif, serif` (elegant, high-contrast)
- `'Playfair', ui-serif, serif` (transitional serif)
- `'Lora', ui-serif, serif` (well-balanced, readable)
- `'Merriweather', ui-serif, serif` (designed for screens)
- `'Crimson Pro', ui-serif, serif` (oldstyle serif)
- `'Fraunces', ui-serif, serif` (display serif, quirky)
- `'Roboto Serif', ui-serif, serif` (modern, geometric)
- `'Aleo', ui-serif, serif` (slab serif, contemporary)

**Monospace (4):**

- `'JetBrains Mono', ui-monospace, monospace` (coding-optimized)
- `'Roboto Mono', ui-monospace, monospace` (clean, modern)
- `'Space Mono', ui-monospace, monospace` (retro, geometric)
- `'Geist Mono', ui-monospace, monospace` (sans-inspired)

**Pairing Recommendations:**

- Classic: Inter (body) + Playfair Display (heading)
- Modern: DM Sans (body) + Space Grotesk (heading)
- Elegant: Source Sans 3 (body) + Lora (heading)
- Warm: Nunito (body) + Merriweather (heading)

## Shadow Components (35 components, 6 categories)

Presets can specify which components receive `box-shadow` via the `shadowComponents` array. Values are PascalCase class names:

| Category               | Components                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Actions** (6)        | Button, ButtonGroup, Dropdown, Menu, MenuItem, MenuLabel                                           |
| **Feedback** (6)       | Alert, Badge, Callout, Tag, Toast, Tooltip                                                         |
| **Form Controls** (10) | Checkbox, Combobox, DatePicker, FileInput, Input, Radio, RadioGroup, Select, Switch, Textarea      |
| **Imagery** (3)        | Avatar, Carousel, ImageComparer                                                                    |
| **Organization** (11)  | Breadcrumb, BreadcrumbItem, Card, Details, Dialog, Drawer, Tab, TabGroup, TabPanel, Tree, TreeItem |
| **Utilities** (2)      | Popover, Popup                                                                                     |

**Usage in JSON:** `"shadowComponents": ["Card", "Button", "Alert"]`

## Existing Presets Reference (8 presets)

All presets are **JSON files** at `docs/src/kigumi-studio/themes/{name}.json`. Use these as inspiration or starting points:

### midnight-blue

**Character:** Blue brand, dark surfaces, elegant typography
**Key tokens:**

```json
"--wa-color-brand": "#3b82f6",
"--wa-font-family-body": "'Inter', ui-sans-serif, system-ui, sans-serif",
"--wa-font-family-heading": "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
"--wa-border-radius-scale": "1.2",
"--wa-shadow-blur-scale": "1.5"
```

### ocean-breeze

**Character:** Teal/cyan brand, light and airy, smooth transitions
**Key tokens:**

```json
"--wa-color-brand": "#0891b2",
"--wa-space-scale": "1.1",
"--wa-border-radius-scale": "2",
"--wa-transition-slow": "400ms"
```

### neo-brutalism

**Character:** Bold colors, sharp corners, thick borders
**Key tokens:**

```json
"--wa-color-brand": "#ff5722",
"--wa-border-radius-scale": "0",
"--wa-border-width-scale": "2",
"--wa-shadow-blur-scale": "0",
"--wa-font-family-body": "'DM Sans', ui-sans-serif, system-ui, sans-serif",
"--wa-font-family-heading": "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
```

### warm-earth

**Character:** Orange/brown brand, generous spacing, organic feel
**Key tokens:**

```json
"--wa-color-brand": "#c2410c",
"--wa-space-scale": "1.3",
"--wa-border-radius-scale": "1.5"
```

### monochrome

**Character:** Grayscale only, minimal, clean
**Key tokens:**

```json
"--wa-color-brand": "#404040",
"--wa-font-size-scale": "0.95",
"--wa-border-radius-scale": "0.5",
"--wa-shadow-blur-scale": "0.8"
```

### canvas

**Character:** Figma/design-tool inspired, black & white, hard shadows, sharp corners
**Key tokens:**

```json
"--wa-color-brand": "#000000",
"--wa-border-radius-scale": "0",
"--wa-border-width-scale": "2",
"--wa-shadow-blur-scale": "0",
"--wa-shadow-offset-x-scale": "0.8",
"--wa-shadow-offset-y-scale": "0.8"
```

**Note:** Has companion `canvas.css` for custom shadow rules on nested cards.

### kanban

**Character:** Atlassian/Jira inspired, blue brand, clean & functional
**Key tokens:**

```json
"--wa-color-brand": "#1868db",
"--wa-font-family-body": "'Inter', ui-sans-serif, system-ui, sans-serif",
"--wa-space-scale": "1.15",
"--wa-border-radius-scale": "0.8",
"--wa-transition-easing": "ease-in-out"
```

### shopaholic

**Character:** Shopify inspired, green brand, subtle shadows, e-commerce focused
**Key tokens:**

```json
"--wa-color-brand": "#95bf47",
"--wa-space-scale": "1.2",
"--wa-border-radius-scale": "1.2",
"--wa-shadow-opacity": "0.08",
"--wa-shadow-blur-scale": "1.5",
"--wa-transition-easing": "ease-out"
```

## Step-by-Step Workflow

### Step 1: Understand Requirements

**For natural language descriptions:**

- Extract mood keywords: warm, cool, professional, playful, minimal, bold, elegant, etc.
- Extract color preferences: mentioned hues, brand colors
- Extract character: brutalist (sharp), organic (rounded), elegant (soft), technical (precise)

**For reference-based modifications:**

- Read the reference preset JSON from `docs/src/kigumi-studio/themes/{name}.json`
- Examine `light` and `dark` token objects
- Identify delta: which tokens to change

### Step 2: Develop Color Palette

**Start with Brand Color:**

- Choose a hex color that represents the theme character
- Blue: professional, trustworthy (e.g., `#3b82f6`)
- Green: natural, growth (e.g., `#16a34a`)
- Orange: warm, energetic (e.g., `#f97316`)
- Purple: creative, luxury (e.g., `#9333ea`)
- Teal/Cyan: calm, modern (e.g., `#0891b2`)
- Red: bold, urgent (e.g., `#dc2626`)

**Derive Surface Colors (Light Mode):**

- **raised:** Lightest (usually `#ffffff` or very light tint)
- **default:** Base background (white or light tint of brand hue)
- **lowered:** Darker than default (light gray or tinted)
- **border:** Visible separation (medium gray or tinted)

Example (blue theme):

```css
--wa-color-surface-raised: #f8fafc;
--wa-color-surface-default: #f1f5f9;
--wa-color-surface-lowered: #e2e8f0;
--wa-color-surface-border: #cbd5e1;
```

**Derive Text Colors (Light Mode):**

- **normal:** Very dark, high contrast to surface-default (aim for 7:1+ ratio)
- **quiet:** Medium contrast (aim for 4.5:1 ratio)
- **link:** Derived from brand or darker variant

Example:

```css
--wa-color-text-normal: #0f172a;
--wa-color-text-quiet: #475569;
--wa-color-text-link: #2563eb;
```

**Dark Mode Inversion - CRITICAL RULES:**

⚠️ **Dark Mode is NOT a new design direction** - it's a COLOR INVERSION of the SAME visual identity!

**NEVER change in Dark Mode:**

- ❌ Border radius scale
- ❌ Border width scale
- ❌ Border style
- ❌ Spacing scale
- ❌ Font families
- ❌ Font weights
- ❌ Font size scale
- ❌ Line heights
- ❌ Shadow blur/spread/offset scales (only opacity changes)
- ❌ Transition timings/easing

**ONLY change in Dark Mode:**

- ✅ Surface colors (inverted hierarchy)
- ✅ Text colors (inverted)
- ✅ Border colors
- ✅ Form control colors
- ✅ Shadow opacity (usually higher in dark)
- ✅ Brand color (optional - only if visibility requires)

**Dark Mode Inversion Process:**

- **Surfaces:** Invert hierarchy (raised becomes darkest, lowered becomes lighter)
- **Text:** Invert (dark becomes light)
- **Brand:** Keep same OR slightly lighter variant ONLY if visibility is poor

Example (dark mode `dark` object in JSON):

```json
"dark": {
  "--wa-color-surface-raised": "#1e293b",
  "--wa-color-surface-default": "#0f172a",
  "--wa-color-surface-lowered": "#020617",
  "--wa-color-surface-border": "#334155",
  "--wa-color-text-normal": "#f1f5f9",
  "--wa-color-text-quiet": "#94a3b8",
  "--wa-color-text-link": "#60a5fa",
  "--wa-form-control-background-color": "#1e293b",
  "--wa-form-control-border-color": "#334155",
  "--wa-form-control-placeholder-color": "#64748b",
  "--wa-shadow-opacity": "0.25"
}
```

**Semantic Colors:**

- Usually keep defaults unless theme demands it
- Success: green shades (`#16a34a`)
- Warning: orange/yellow (`#d97706`)
- Danger: red (`#dc2626`)
- Neutral: gray (`#6b7280`)

### Step 3: Choose Typography

**Guidelines:**

- **Body:** Prioritize readability (sans-serif recommended)
- **Heading:** Can contrast with body (serif + sans, display font)
- **Code:** Rarely change from monospace
- **Longform:** Serif for reading comfort

**Character-based choices:**

- **Professional:** Inter (body) + Plus Jakarta Sans (heading)
- **Elegant:** Source Sans 3 (body) + Playfair Display (heading)
- **Playful:** Poppins (body) + Space Grotesk (heading)
- **Warm/Organic:** Nunito (body) + Merriweather (heading)
- **Minimal:** System defaults

### Step 4: Configure Scales

**Border Radius:**

- `0`: Sharp corners (brutalist)
- `0.5-1`: Subtle rounding (minimal)
- `1-1.5`: Default/standard
- `1.5-2.5`: Rounded, friendly
- `3`: Very rounded

**Spacing:**

- `0.5-0.8`: Compact
- `1`: Default
- `1.2-1.5`: Generous, airy

**Border Width:**

- `0.5-0.7`: Delicate
- `1`: Default
- `1.5-3`: Bold, thick (brutalist)

**Font Size:**

- `0.85-0.95`: Compact
- `1`: Default
- `1.05-1.2`: Large, accessible

### Step 5: Configure Shadows

**Brutalist (flat):**

```css
--wa-shadow-blur-scale: 0;
--wa-shadow-spread-scale: 0;
--wa-shadow-offset-x-scale: 0.5;
--wa-shadow-offset-y-scale: 0.5;
```

**Elegant (soft, floating):**

```css
--wa-shadow-blur-scale: 1.5-2.5;
--wa-shadow-spread-scale: -0.3 to -0.5;
--wa-shadow-offset-y-scale: 0.6-1;
--wa-shadow-opacity: 0.15 (light) / 0.4 (dark);
```

**Minimal (subtle):**

```css
--wa-shadow-blur-scale: 0.8-1;
--wa-shadow-spread-scale: -0.5;
--wa-shadow-opacity: 0.1 (light) / 0.3 (dark);
```

### Step 6: Configure Transitions

**Fast/Snappy:**

```css
--wa-transition-fast: 50ms;
--wa-transition-normal: 100ms;
--wa-transition-slow: 200ms;
--wa-transition-easing: ease;
```

**Smooth/Elegant:**

```css
--wa-transition-fast: 100ms;
--wa-transition-normal: 200ms;
--wa-transition-slow: 400ms;
--wa-transition-easing: ease-in-out;
```

### Step 7: Generate JSON Preset File

**File Path:** `docs/src/kigumi-studio/themes/{kebab-case-name}.json`

Presets use a **JSON format** defined by the `PresetJSON` interface in `preset-schema.ts`. The preset loader (`preset-loader.ts`) auto-discovers JSON files via `import.meta.glob`.

**Schema:**

```typescript
interface PresetJSON {
  version: 1; // Always 1
  name: string; // Display name (e.g., "Midnight Blue")
  description?: string; // Optional description
  light: Record<string, string>; // Light mode token overrides
  dark: Record<string, string>; // Dark mode token overrides (colors only)
  shadowComponents?: string[]; // PascalCase class names (e.g., ["Card", "Button"])
}
```

**Example JSON preset:**

```json
{
  "version": 1,
  "name": "My Theme",
  "shadowComponents": ["Card"],
  "light": {
    "--wa-color-brand": "#3b82f6",
    "--wa-color-surface-raised": "#f8fafc",
    "--wa-color-surface-default": "#f1f5f9",
    "--wa-color-surface-lowered": "#e2e8f0",
    "--wa-color-surface-border": "#cbd5e1",
    "--wa-color-text-normal": "#0f172a",
    "--wa-color-text-quiet": "#475569",
    "--wa-color-text-link": "#2563eb",
    "--wa-font-family-body": "'Inter', ui-sans-serif, system-ui, sans-serif",
    "--wa-font-family-heading": "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
    "--wa-border-radius-scale": "1.2",
    "--wa-border-width-scale": "0.8",
    "--wa-shadow-blur-scale": "1.5",
    "--wa-shadow-spread-scale": "-0.3",
    "--wa-transition-easing": "ease-in-out"
  },
  "dark": {
    "--wa-color-surface-raised": "#1e293b",
    "--wa-color-surface-default": "#0f172a",
    "--wa-color-surface-lowered": "#020617",
    "--wa-color-surface-border": "#334155",
    "--wa-color-text-normal": "#f1f5f9",
    "--wa-color-text-quiet": "#94a3b8",
    "--wa-color-text-link": "#60a5fa",
    "--wa-form-control-background-color": "#0f172a",
    "--wa-form-control-border-color": "#334155",
    "--wa-form-control-placeholder-color": "#64748b"
  }
}
```

**Rules:**

- `version` must be `1`
- `name` is the human-readable display name shown in the Studio dropdown
- `light` contains ALL non-default tokens: colors + structural tokens (fonts, scales, borders, shadows, transitions)
- `dark` contains ONLY mode-dependent color overrides (surfaces, text, form controls, shadow opacity)
- Structural tokens (fonts, scales, borders, etc.) go ONLY in `light` — the Studio handles mirroring them to dark mode automatically
- ONLY include tokens that differ from WA defaults — do NOT include all 43 tokens
- All values are **strings** (even numbers: `"1.2"` not `1.2`)
- Shadow color as hex string, opacity as decimal string (e.g., `"0.2"`)
- Transition values include unit suffix (e.g., `"100ms"`)
- `shadowComponents` uses PascalCase class names from the shadow components list

**Optional companion CSS file:**

For custom CSS rules beyond tokens (e.g., component-specific overrides), create a companion `.css` file with the same base name:

```
themes/canvas.json       ← tokens + shadow components
themes/canvas.css        ← custom CSS overrides (optional)
```

The companion CSS is loaded automatically by `preset-loader.ts` via `import.meta.glob('../themes/*.css')`.

Example companion CSS (`canvas.css`):

```css
/* Nested cards should not have additional shadows */
.Card > .Card {
  box-shadow: none;
}
```

### Step 8: Validation

**Contrast Checks (use online tool like https://webaim.org/resources/contrastchecker/):**

- [ ] `text-normal` vs `surface-default` (light): >= 4.5:1 (WCAG AA)
- [ ] `text-quiet` vs `surface-default` (light): >= 3:1 (minimum)
- [ ] `text-normal` vs `surface-default` (dark): >= 4.5:1
- [ ] `text-quiet` vs `surface-default` (dark): >= 3:1

**Surface Hierarchy:**

- [ ] Light mode: raised (lightest) > default > lowered (darkest)
- [ ] Dark mode: lowered (lightest) > default > raised (darkest)

**Token Consistency:**

- [ ] All slider values within defined ranges
- [ ] Font values match `font-definitions.ts` exactly (including quotes and fallbacks)
- [ ] Shadow properties in correct format (hex + opacity, not rgb)
- [ ] No unknown CSS variables (stick to the 43 Studio tokens)
- [ ] All values are strings in the JSON (e.g., `"1.2"` not `1.2`)

**JSON Schema:**

- [ ] `version` is `1`
- [ ] `name` is a non-empty string
- [ ] `light` and `dark` are objects with string keys and string values
- [ ] `shadowComponents` (if present) contains valid PascalCase class names from `shadow-components.ts`
- [ ] Structural tokens (fonts, scales, borders, etc.) are in `light` only, NOT duplicated in `dark`
- [ ] `dark` contains only mode-dependent color overrides

**Dark Mode:**

- [ ] Surface colors, text colors, form control colors defined in `dark`
- [ ] Shadow opacity adjusted for dark mode (usually higher)

**Automated Validation:**
Run the preset schema test suite to validate all presets:

```bash
pnpm vitest run docs/src/kigumi-studio/__tests__/preset-schema.test.ts
```

This checks: version, name, known properties, valid shadow class names, non-empty values.

### Step 9: Preview Instructions

After creating the preset file, instruct the user:

```
Preview your new preset:
1. Run `pnpm dev` from the docs directory
2. Open http://localhost:5173/kigumi-studio
3. Click the preset dropdown in the header
4. Select "{Preset Name}" from the list
5. Toggle between light/dark mode to test both variants
6. Check components in the preview area
```

The preset will be automatically detected via `import.meta.glob()` in `preset-loader.ts` - no code changes needed.

## Extended Web Awesome Tokens

Beyond the 43 Studio tokens, you can include additional Web Awesome tokens in a companion `.css` file alongside the preset JSON. These will work in exported themes but won't be editable in the Studio UI:

**Extended Tokens (examples):**

- `--wa-link-decoration-default` (none, underline)
- `--wa-link-decoration-hover` (none, underline)
- `--wa-focus-ring-width` (in rem)
- `--wa-focus-ring-offset` (in rem)
- `--wa-form-control-border-radius` (var(--wa-border-radius-m), etc.)
- `--wa-form-control-height-{size}` (custom heights)
- Component-specific tokens (see llms.txt)

**Where to find them:**

- Full list in `docs/node_modules/.pnpm/@awesome.me+webawesome-pro@3.2.1_.../dist/llms.txt`
- Default theme: `docs/node_modules/.pnpm/@awesome.me+webawesome-pro@3.2.1_.../dist/styles/themes/default.css`

**Warning:** `css-parser.ts` will warn "Unknown property" for these, but they ARE valid and will work in exported CSS.

## File Path References

**Read these files for comprehensive context:**

| File                                                                                                                                                                                                                                                                                   | Purpose                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [docs/src/kigumi-studio/lib/property-definitions.ts](../../../docs/src/kigumi-studio/lib/property-definitions.ts)                                                                                                                                                                      | Canonical 43 token definitions           |
| [docs/src/kigumi-studio/lib/preset-schema.ts](../../../docs/src/kigumi-studio/lib/preset-schema.ts)                                                                                                                                                                                    | PresetJSON TypeScript interface          |
| [docs/src/kigumi-studio/lib/preset-loader.ts](../../../docs/src/kigumi-studio/lib/preset-loader.ts)                                                                                                                                                                                    | Auto-discovery of JSON + CSS presets     |
| [docs/src/kigumi-studio/lib/font-definitions.ts](../../../docs/src/kigumi-studio/lib/font-definitions.ts)                                                                                                                                                                              | All 26 Bunny Fonts with URLs             |
| [docs/src/kigumi-studio/lib/shadow-components.ts](../../../docs/src/kigumi-studio/lib/shadow-components.ts)                                                                                                                                                                            | 35 shadow-eligible components            |
| [docs/src/kigumi-studio/lib/color-utils.ts](../../../docs/src/kigumi-studio/lib/color-utils.ts)                                                                                                                                                                                        | OKLCH palette generation (advanced)      |
| [docs/src/kigumi-studio/lib/css-generator.ts](../../../docs/src/kigumi-studio/lib/css-generator.ts)                                                                                                                                                                                    | CSS export format logic                  |
| [docs/src/kigumi-studio/lib/css-parser.ts](../../../docs/src/kigumi-studio/lib/css-parser.ts)                                                                                                                                                                                          | CSS import/parse logic                   |
| [docs/src/kigumi-studio/themes/\*.json](../../../docs/src/kigumi-studio/themes/)                                                                                                                                                                                                       | All 8 existing preset JSON files         |
| [docs/src/kigumi-studio/**tests**/preset-schema.test.ts](../../../docs/src/kigumi-studio/__tests__/preset-schema.test.ts)                                                                                                                                                              | Automated preset validation tests        |
| [docs/node*modules/.pnpm/@awesome.me+webawesome-pro@3.2.1*.../dist/llms.txt](../../../docs/node_modules/.pnpm/@awesome.me+webawesome-pro@3.2.1_@floating-ui+utils@0.2.10_@types+react@19.2.13/node_modules/@awesome.me/webawesome-pro/dist/llms.txt)                                   | Full Web Awesome API documentation       |
| [docs/node*modules/.pnpm/@awesome.me+webawesome-pro@3.2.1*.../dist/styles/themes/default.css](../../../docs/node_modules/.pnpm/@awesome.me+webawesome-pro@3.2.1_@floating-ui+utils@0.2.10_@types+react@19.2.13/node_modules/@awesome.me/webawesome-pro/dist/styles/themes/default.css) | WA default theme with all palette tokens |

## Common Pitfalls

1. **CRITICAL: Structural tokens go in `light` only** ⚠️
   - In the JSON format, structural tokens (fonts, scales, borders, shadows, transitions) go **only in the `light` object**
   - The Studio's `importValues()` automatically mirrors mode-independent tokens to dark mode
   - The `dark` object should contain **only mode-dependent color overrides** (surfaces, text, form controls, shadow opacity)
   - ❌ **BAD** (structural token duplicated in dark):
     ```json
     {
       "light": { "--wa-border-radius-scale": "0" },
       "dark": { "--wa-border-radius-scale": "0" }
     }
     ```
   - ✅ **CORRECT** (structural token only in light):
     ```json
     {
       "light": {
         "--wa-border-radius-scale": "0",
         "--wa-color-surface-default": "#f7f8f9"
       },
       "dark": { "--wa-color-surface-default": "#1d2125" }
     }
     ```

2. **All JSON values must be strings.** Even numeric values: `"1.2"` not `1.2`. Transition values include the unit: `"100ms"`.

3. **Shadow format:** In preset JSON, use `"--wa-color-shadow": "#000000"` and `"--wa-shadow-opacity": "0.2"`. DO NOT write `rgb(r g b / opacity)` - that's the CSS export format.

4. **Font values:** Must match exactly: `'Font Name', fallback-stack`. Check `font-definitions.ts` for exact strings. Quotes within JSON strings: `"'Inter', ui-sans-serif, system-ui, sans-serif"`.

5. **Brand color mode-dependence:** `--wa-color-brand` is NOT mode-dependent by default. Place in `light` only. Only add to `dark` if visibility is critically poor on dark surfaces.

6. **Surface hierarchy:** In light mode, raised is LIGHTEST. In dark mode, raised is DARKEST (inverted).

7. **Contrast ratios:** Always validate text colors against surfaces. Low contrast = accessibility issue.

8. **Slider ranges:** Don't exceed defined min/max values. `--wa-border-radius-scale` max is 3, not 5.

9. **Company CI Consistency:** When creating themes inspired by companies (Atlassian, Shopify, Figma), stay true to their ACTUAL design system. Don't improvise - research their tokens, check screenshots, ask clarifying questions if unclear.

10. **Preset naming:** Use kebab-case for filenames (`my-theme.json`), not camelCase or spaces.

11. **Run tests after creating a preset:** `pnpm vitest run docs/src/kigumi-studio/__tests__/preset-schema.test.ts` validates all JSON presets against the schema. New presets must be imported in the test file to be validated.

12. **Shadow components:** Values in `shadowComponents` must be valid PascalCase class names from `shadow-components.ts`. Use the full list in the Shadow Components section above.

## Output Format

When complete, show:

```
✓ Preset: {Name}
  {Character description}

✓ Created: docs/src/kigumi-studio/themes/{name}.json
  (optional: docs/src/kigumi-studio/themes/{name}.css for custom overrides)

Token Summary:
  Brand Color:  #{hex} ({description})
  Surfaces:     {light mode description}
  Text:         {contrast ratios}
  Typography:   Body: {font}, Heading: {font}
  Scale:        Space {x}, Radius {x}, Border {x}
  Shadows:      {character description}
  Transitions:  Fast {x}ms, Normal {x}ms, Slow {x}ms

Validation:
  [✓] Text contrast (light): {ratio}:1 (WCAG AA: 4.5:1+)
  [✓] Quiet text contrast (light): {ratio}:1 (3:1+)
  [✓] Surface hierarchy: raised > default > lowered
  [✓] Dark mode contrast: {ratio}:1
  [✓] All values within ranges
  [✓] Font names valid
  [✓] JSON schema valid (version, name, light, dark)
  [✓] preset-schema.test.ts passes

Next Steps:
  1. Import the new preset in preset-schema.test.ts and add to the presets array
  2. Run: pnpm vitest run docs/src/kigumi-studio/__tests__/preset-schema.test.ts
  3. cd docs && pnpm dev
  4. Open http://localhost:5173/kigumi-studio
  5. Select "{Name}" from preset dropdown
  6. Toggle light/dark mode to test
```

## Example Usage

**User:** "Create a warm sunset theme preset for Kigumi Studio"

**Agent:**

1. Extracts mood: warm, sunset → orange/coral brand, warm surfaces
2. Develops palette:
   - Brand: `#f97316` (orange)
   - Surfaces (light): cream/peach tints
   - Text: warm browns
   - Dark mode: deep orange-brown surfaces
3. Typography: Source Sans 3 (readable) + Bitter (warm serif heading)
4. Scale: Generous spacing (1.3), rounded corners (1.5)
5. Shadows: Soft, warm glow (high blur, moderate opacity)
6. Creates `docs/src/kigumi-studio/themes/warm-sunset.json`
7. Adds import to `preset-schema.test.ts` and runs validation
8. Validates contrast ratios
9. Provides preview instructions

---

**Additional Resources:**

- Web Awesome docs: https://webawesome.com/docs/
- WCAG contrast checker: https://webaim.org/resources/contrastchecker/
- OKLCH color picker: https://oklch.com/
- Kigumi Studio architecture: [docs/src/kigumi-studio/AGENTS.md](../../../docs/src/kigumi-studio/AGENTS.md)
