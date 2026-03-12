---
name: generate-theme-preset
description: >
  Create, modify, and validate theme presets for Kigumi Studio.
  Use when the user wants to design a new theme, adjust an existing preset,
  create a color palette, or needs help with Web Awesome design tokens,
  Kigumi Studio themes, or JSON preset files.
user-invocable: true
allowed-tools: Read, Glob, Bash, WebFetch
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

## Token Reference

Kigumi Studio supports 43 Web Awesome design tokens organized in 15 groups. See [references/token-definitions.md](references/token-definitions.md) for the complete token table with defaults, input types, and ranges.

Key groups:

- **Colors** (12): Brand (1), Surface (4), Text (3), Semantic (4)
- **Typography** (12): Families (4), Weights (4), Size Scale (1), Line Heights (3)
- **Spacing & Layout** (4): Space (1), Border Radius (1), Border Width & Style (2)
- **Visual Effects** (11): Shadows (6), Form Controls (4), Focus Ring (1)
- **Motion** (4): Transitions (4)

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

**Derive Text Colors (Light Mode):**

- **normal:** Very dark, high contrast to surface-default (aim for 7:1+ ratio)
- **quiet:** Medium contrast (aim for 4.5:1 ratio)
- **link:** Derived from brand or darker variant

**Semantic Colors:** Usually keep defaults unless theme demands it (success: `#16a34a`, warning: `#d97706`, danger: `#dc2626`, neutral: `#6b7280`).

### Step 3: Dark Mode Inversion — CRITICAL RULES

Dark mode is NOT a new design direction — it's a COLOR INVERSION of the SAME visual identity.

**NEVER change in Dark Mode:**

- Border radius, width, or style scales
- Spacing scale
- Font families, weights, or size scale
- Line heights
- Shadow blur/spread/offset scales (only opacity changes)
- Transition timings/easing

**ONLY change in Dark Mode:**

- Surface colors (inverted hierarchy)
- Text colors (inverted)
- Border colors
- Form control colors
- Shadow opacity (usually higher in dark)
- Brand color (optional — only if visibility is critically poor)

**Surface hierarchy inverts:** In light mode, raised is LIGHTEST. In dark mode, raised is DARKEST.

### Step 4: Choose Typography

See [references/fonts.md](references/fonts.md) for the full Bunny Fonts list.

**Character-based choices:**

- **Professional:** Inter (body) + Plus Jakarta Sans (heading)
- **Elegant:** Source Sans 3 (body) + Playfair Display (heading)
- **Playful:** Poppins (body) + Space Grotesk (heading)
- **Warm/Organic:** Nunito (body) + Merriweather (heading)
- **Minimal:** System defaults

**Font Value Format:** `'Font Name', ui-sans-serif, system-ui, sans-serif` (with single quotes around font name).

### Step 5: Configure Scales

| Property      | Sharp/Brutalist | Default | Rounded/Generous |
| ------------- | --------------- | ------- | ---------------- |
| Border Radius | `0`             | `1`     | `1.5-2.5`        |
| Spacing       | `0.5-0.8`       | `1`     | `1.2-1.5`        |
| Border Width  | `1.5-3`         | `1`     | `0.5-0.7`        |
| Font Size     | `0.85-0.95`     | `1`     | `1.05-1.2`       |

### Step 6: Configure Shadows

See [references/shadow-components.md](references/shadow-components.md) for the list of 35 shadow-eligible components.

**Brutalist:** blur=0, spread=0, offset-x=0.5, offset-y=0.5
**Elegant:** blur=1.5-2.5, spread=-0.3 to -0.5, opacity=0.15 (light) / 0.4 (dark)
**Minimal:** blur=0.8-1, spread=-0.5, opacity=0.1 (light) / 0.3 (dark)

### Step 7: Generate JSON Preset File

**File Path:** `docs/src/kigumi-studio/themes/{kebab-case-name}.json`

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

**Rules:**

- `light` contains ALL non-default tokens: colors + structural tokens (fonts, scales, borders, shadows, transitions)
- `dark` contains ONLY mode-dependent color overrides (surfaces, text, form controls, shadow opacity)
- Structural tokens go ONLY in `light` — the Studio handles mirroring them to dark mode automatically
- ONLY include tokens that differ from WA defaults
- All values are **strings** (even numbers: `"1.2"` not `1.2`)
- Shadow color as hex string, opacity as decimal string (e.g., `"0.2"`)
- Transition values include unit suffix (e.g., `"100ms"`)

**Optional companion CSS file:**

For custom CSS rules beyond tokens, create `themes/{name}.css` alongside the JSON. Auto-loaded by `preset-loader.ts`.

### Step 8: Validation

**Contrast Checks:**

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
- [ ] All values are strings in the JSON
- [ ] Structural tokens in `light` only, NOT duplicated in `dark`

**Automated Validation:**

```bash
pnpm vitest run docs/src/kigumi-studio/__tests__/preset-schema.test.ts
```

### Step 9: Preview Instructions

```
Preview your new preset:
1. Run `pnpm dev` from the docs directory
2. Open http://localhost:5173/kigumi-studio
3. Click the preset dropdown in the header
4. Select "{Preset Name}" from the list
5. Toggle between light/dark mode to test both variants
6. Check components in the preview area
```

The preset will be automatically detected via `import.meta.glob()` in `preset-loader.ts` — no code changes needed.

## Existing Presets

See [references/existing-presets.md](references/existing-presets.md) for descriptions and key tokens of all 8 existing presets. Use as inspiration or starting points.

## Extended Web Awesome Tokens

Beyond the 43 Studio tokens, you can include additional Web Awesome tokens in a companion `.css` file. These work in exported themes but aren't editable in the Studio UI.

**Where to find them:**

- `docs/node_modules/.pnpm/@awesome.me+webawesome-pro@3.2.1_.../dist/llms.txt`
- Default theme: `docs/node_modules/.pnpm/@awesome.me+webawesome-pro@3.2.1_.../dist/styles/themes/default.css`

## File Path References

| File                                                     | Purpose                              |
| -------------------------------------------------------- | ------------------------------------ |
| `docs/src/kigumi-studio/lib/property-definitions.ts`     | Canonical 43 token definitions       |
| `docs/src/kigumi-studio/lib/preset-schema.ts`            | PresetJSON TypeScript interface      |
| `docs/src/kigumi-studio/lib/preset-loader.ts`            | Auto-discovery of JSON + CSS presets |
| `docs/src/kigumi-studio/lib/font-definitions.ts`         | All 26 Bunny Fonts with URLs         |
| `docs/src/kigumi-studio/lib/shadow-components.ts`        | 35 shadow-eligible components        |
| `docs/src/kigumi-studio/lib/color-utils.ts`              | OKLCH palette generation             |
| `docs/src/kigumi-studio/lib/css-generator.ts`            | CSS export format logic              |
| `docs/src/kigumi-studio/lib/css-parser.ts`               | CSS import/parse logic               |
| `docs/src/kigumi-studio/themes/*.json`                   | All existing preset JSON files       |
| `docs/src/kigumi-studio/__tests__/preset-schema.test.ts` | Automated preset validation tests    |

## Common Pitfalls

1. **Structural tokens go in `light` only** — The `dark` object should contain only mode-dependent color overrides. The Studio mirrors mode-independent tokens automatically.

2. **All JSON values must be strings.** Even numeric values: `"1.2"` not `1.2`. Transition values include the unit: `"100ms"`.

3. **Shadow format:** Use `"--wa-color-shadow": "#000000"` and `"--wa-shadow-opacity": "0.2"` as separate properties. DO NOT write `rgb(r g b / opacity)`.

4. **Font values:** Must match exactly: `'Font Name', fallback-stack`. Check `font-definitions.ts` for exact strings.

5. **Brand color mode-dependence:** `--wa-color-brand` is NOT mode-dependent by default. Place in `light` only. Only add to `dark` if visibility is critically poor on dark surfaces.

6. **Surface hierarchy inverts in dark mode:** Raised is LIGHTEST in light mode, DARKEST in dark mode.

7. **Contrast ratios:** Always validate text colors against surfaces. Low contrast = accessibility issue.

8. **Slider ranges:** Don't exceed defined min/max values. `--wa-border-radius-scale` max is 3, not 5.

9. **Company CI Consistency:** When creating themes inspired by companies, stay true to their ACTUAL design system. Don't improvise — research their tokens, check screenshots.

10. **Preset naming:** Use kebab-case for filenames (`my-theme.json`).

11. **Run tests after creating a preset:** `pnpm vitest run docs/src/kigumi-studio/__tests__/preset-schema.test.ts`

12. **Shadow components:** Values in `shadowComponents` must be valid PascalCase class names from `shadow-components.ts`.

## Output Format

When complete, show:

```
✓ Preset: {Name}
  {Character description}

✓ Created: docs/src/kigumi-studio/themes/{name}.json

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
