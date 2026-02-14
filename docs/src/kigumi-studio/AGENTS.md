# Kigumi Studio - Agent Guide

Visual theme builder for Web Awesome CSS custom properties.

## Guard Rails - NEVER

- NEVER use `className` on `<wa-*>` elements. Always `class`.
- NEVER use `declare module 'react'`. Always `declare global`.
- NEVER add external state libraries (Redux, Zustand, Jotai).
- NEVER modify the existing `ThemeContext`. Use the separate `StudioContext`.
- NEVER modify files in `src/` (CLI source). Only `docs/src/`.
- NEVER modify existing `docs/src/components/ui/` wrappers.
- NEVER import Kigumi Studio CSS into Landing Page styles.
- NEVER use `!important` in CSS. Use cascade layers.
- NEVER store computed CSS as state. Always derive from source values.
- NEVER use `any` type. Use `unknown` or proper types.
- NEVER render raw `<wa-*>` elements. Always use `@/components/ui` wrappers.

## Guard Rails - ALWAYS

- ALWAYS use existing UI wrappers from `@/components/ui` (Button, Card, Input, Select, ColorPicker, Details, Slider, Switch, Dialog, Dropdown, etc.)
- ALWAYS follow Web Awesome event pattern (`useEffect` + `addEventListener` for `wa-*` events)
- ALWAYS keep CSS in separate `.css` files (no CSS-in-JS)
- ALWAYS use `clsx` for conditional class names
- ALWAYS use TypeScript strict mode
- ALWAYS verify after changes: `pnpm dev` + TypeScript check
- ALWAYS use inline `style` with CSS custom properties for the preview wrapper
- ALWAYS maintain preview isolation: Studio theme must not leak to Landing Page

## Architecture

```
KigumiStudio (page)
  StudioProvider (context: ~43 CSS properties, light/dark modes)
    StudioLayout
      StudioHeader (mode toggles, preset selector, import/export, reset)
      StudioSidebar (scrollable editor sections)
      StudioPreview (live component showcase with applied theme)
```

## State Flow

```
Editor Controls → setProperty(cssVar, value) → StudioContext.values[cssVar][editMode]
  → getStyleObject(previewMode) → style={} on Preview container
  → Web Awesome components inherit CSS custom properties via cascade
```

## Key Files

| File                          | Purpose                                       |
| ----------------------------- | --------------------------------------------- |
| `contexts/StudioContext.tsx`  | State management (~43 properties, light/dark) |
| `lib/property-definitions.ts` | Property metadata (43 definitions)            |
| `lib/defaults.ts`             | Default values from Web Awesome               |
| `lib/css-parser.ts`           | Parse `:root {}` and `.wa-dark {}` blocks     |
| `lib/css-generator.ts`        | Generate CSS output                           |
| `lib/preset-loader.ts`        | Load preset CSS files via `import.meta.glob`  |
| `themes/*.css`                | Preset theme CSS files                        |

## Testing

```bash
cd docs && npx vitest run src/kigumi-studio/__tests__/
```
