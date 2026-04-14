---
'kigumi': patch
---

### Fixed

- **`kigumi add` -- vite-env.d.ts tag names for multi-word components**: `updateViteEnvTypes()` used `.toLowerCase()` on PascalCase component names, producing wrong tag names like `'wa-buttongroup'` instead of `'wa-button-group'` in `src/vite-env.d.ts`. TypeScript no longer recognized the actual `<wa-button-group>` tag. ~25 of 74 multi-word components were affected. The function now uses `toKebabCase()` for correct kebab-case conversion.
