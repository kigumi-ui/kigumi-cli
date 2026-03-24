---
name: apply-theme-to-figma
description: >
  Apply CSS custom properties (--wa-* design tokens) to the Kigumi Figma UI Kit
  by updating Figma variables via Figma Console MCP. Handles scale computation
  (space, font-size, border-radius, border-width, shadow), color parsing (hex/rgb),
  font families, and Light/Dark mode separation. Use this skill whenever the user
  pastes CSS with --wa-* variables and wants Figma updated, says "sync to Figma",
  "apply theme to Figma", "update Figma variables", or exports from Kigumi Studio.
  Also use when the user asks to make Figma match a code theme, or wants to push
  design tokens from CSS into Figma.
user-invocable: true
allowed-tools: Read, Bash, mcp__figma-console__figma_execute, mcp__figma-console__figma_batch_update_variables, mcp__figma-console__figma_get_status, mcp__figma-console__figma_take_screenshot
---

# Apply Theme to Figma

Takes CSS custom properties (`--wa-*` tokens from a Kigumi Studio export, a theme.css file, or pasted CSS) and updates Figma variables in the connected Kigumi UI Kit file via Figma Console MCP.

The key challenge this skill solves: CSS uses scale factors (e.g., `--wa-space-scale: 1.15`) with `calc()` to derive token values, but Figma needs pre-computed pixel values. This skill bridges that gap by computing all derived values from a scale factor and updating every affected Figma variable.

## Workflow

### Step 1: Verify Figma Connection

Call `figma_get_status` and confirm:

- WebSocket connection is active
- The connected file is "Kigumi - UI Kit" (or whatever Kigumi file the user is working with)

If not connected, tell the user to open the Figma file and ensure the Figma Console MCP plugin is running.

### Step 2: Parse CSS Input

Extract `--wa-*` properties from the user's CSS. Separate into two groups based on the CSS block they appear in:

- **Light mode**: properties inside `:root { }` or at the top level
- **Dark mode**: properties inside `.wa-dark { }`

**Parsing approach**: Use a regex-based extraction. For each block, find all lines matching `--wa-[\w-]+:\s*(.+);` and build a key-value map. Strip quotes from font-family values. This doesn't need to handle every CSS edge case -- Studio exports are well-formed single-declaration-per-line CSS.

**Color value handling**:

- Hex values (`#rgb`, `#rrggbb`, `#rrggbbaa`): convert to `{r, g, b, a}` with 0-1 range
- `rgb(r, g, b)` / `rgba(r, g, b, a)`: parse and normalize to 0-1
- Skip `color-mix()`, `var()` references, and other complex values -- log a warning

### Step 3: Build Variable Mapping (Dynamic)

Query the connected Figma file to build the mapping at runtime. This avoids hardcoding IDs that would break if the file changes.

```javascript
// Run via figma_execute -- returns the mapping + mode IDs
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const mapping = {};
const modeIds = {};

for (const col of collections) {
  modeIds[col.name] = col.modes.map((m) => ({ id: m.modeId, name: m.name }));
  for (const varId of col.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(varId);
    if (v?.codeSyntax?.WEB) {
      const css = v.codeSyntax.WEB.replace(/^var\(/, '').replace(/\)$/, '');
      mapping[css] = {
        id: v.id,
        name: v.name,
        type: v.resolvedType,
        collection: col.name,
        collectionId: col.id,
      };
    }
  }
}
return { mapping, modeIds };
```

From `modeIds`, resolve:

- **Primitives Default mode**: the mode in the "Primitives" collection (usually named "Default")
- **Theme Colors Light mode**: the "Light" mode in "Theme (Colors)"
- **Theme Colors Dark mode**: the "Dark" mode in "Theme (Colors)"

### Step 4: Resolve Values

For each CSS property from the input, determine what to update. Properties fall into three categories, checked in this order:

#### 4a: Scale Properties (recognized by name, NOT in codeSyntax mapping)

Scale properties are meta-tokens that don't exist as Figma variables. They have no `codeSyntax.WEB` entry, so the dynamic mapping from Step 3 will NOT find them. Recognize them by exact name match:

```
--wa-space-scale           -> recompute 11 space tokens
--wa-font-size-scale       -> recompute 9 font size + 12 form control tokens
--wa-border-width-scale    -> recompute 3 border width tokens
--wa-border-radius-scale   -> recompute 3 border radius tokens (Pill/Square unaffected)
--wa-shadow-offset-y-scale -> recompute 3 shadow offset Y tokens
--wa-shadow-offset-x-scale -> recompute 3 shadow offset X tokens
--wa-shadow-blur-scale     -> recompute 3 shadow blur tokens
--wa-shadow-spread-scale   -> recompute 3 shadow spread tokens
```

Formula: `round(scale * base_rem_multiplier * 16)`. Refer to [scale-computation.md](references/scale-computation.md) for the complete tables, base multipliers, and variable ID lookup.

**Font size scale is special**: changing font-size-scale also requires recomputing all 12 form control tokens (Height, Padding Block, Padding Inline, Toggle Size for S/M/L), because those depend on the computed font sizes.

#### 4b: Direct Properties (found in codeSyntax mapping)

These map 1:1 to a Figma variable. Look up the CSS property name in the mapping from Step 3.

- **Colors** (`--wa-color-surface-default`, `--wa-form-control-border-color`, etc.): update in the Light or Dark mode of Theme (Colors), depending on which CSS block they came from
- **Font weights** (`--wa-font-weight-bold`, etc.): numeric, update in Primitives Default mode
- **Font families** (`--wa-font-family-body`, etc.): string, update in Primitives Default mode

#### 4c: Unresolvable Properties (not a scale, not in mapping)

- `--wa-color-brand`: **Warn the user.** This is a palette hue that maps to 11 Color Variant steps (Brand/05 through Brand/95). Updating a single brand color requires regenerating the entire palette. This is a future capability.
- `--wa-transition-*`, `--wa-link-decoration-*`, `--wa-border-style`: No Figma equivalent. Skip silently.
- Any other `--wa-*` property not matched: log it so the user knows it was skipped.

### Step 5: Update Figma Variables

Batch the updates for efficiency:

- **Colors**: Use `figma_batch_update_variables` with hex values. Group by mode (Light vs Dark) and send separate batches.
- **Numbers (FLOAT)**: Use `figma_batch_update_variables` with numeric values. All go to Primitives Default mode.
- **Strings**: Use `figma_execute` since `figma_batch_update_variables` doesn't support string values. Update font families via the variable object pattern (`v.setValueForMode(modeId, value)`).

### Step 6: Verify

Take a screenshot of a key component (Button or Card) to visually confirm the theme was applied. Show it to the user.

## Example

User pastes:

```css
:root {
  --wa-color-surface-default: #f7f8f9;
  --wa-font-family-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --wa-font-weight-bold: 600;
  --wa-space-scale: 1.15;
  --wa-border-radius-scale: 0.8;
}

.wa-dark {
  --wa-color-surface-default: #1d2125;
}
```

Agent actions:

1. Verify Figma connection is active
2. Parse: 5 light-mode properties, 1 dark-mode property
3. Query Figma for variable mapping (133 variables with codeSyntax)
4. Direct updates: surface-default (Light=#f7f8f9, Dark=#1d2125), font-weight-bold=600, font-family-body='Inter', ui-sans-serif, system-ui, sans-serif'
5. Scale: space-scale=1.15 -> compute Space/3XS=2, Space/2XS=5, Space/XS=9, Space/S=14, Space/M=18, Space/L=28, Space/XL=37, Space/2XL=46, Space/3XL=55, Space/4XL=74, Content=28
6. Scale: border-radius-scale=0.8 -> Radius/S=2, Radius/M=5, Radius/L=10
7. Batch update all values via MCP
8. Screenshot Card component to verify

## Edge Cases

- **Multiple Figma files open**: The MCP executes against the _active_ file. Verify the file name in Step 1.
- **Primitives has multiple modes** (e.g., Default + Tailspin): Always update the first/default mode only. The skill syncs the base theme, not per-theme overrides.
- **User provides individual token values AND a scale**: Individual values take precedence. If user sets both `--wa-space-scale: 1.5` and `--wa-space-m: 20`, use 20 for Space/M and compute the rest from the scale.
- **Resetting to defaults**: If user says "reset to default", apply scale=1 for all scale groups and use the default.css values from the WA package.
