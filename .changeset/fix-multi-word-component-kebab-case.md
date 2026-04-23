---
'kigumi': patch
---

### Fixed

- **Multi-word components (e.g. `ButtonGroup`, `TreeItem`, `ColorPicker`) are now correctly resolved by `kigumi diff` and `kigumi update`.** The `resolveComponents` scan branch used `name.toLowerCase()` to build registry keys, which produced `buttongroup` instead of `button-group` and silently skipped ~25 of 74 components — `diff` and `update` would simply not see them. The explicit-name branch normalised user input with a naive `charAt(0).toUpperCase()`, turning `button-group` into `Button-group` and breaking the downstream snapshot/config lookups. Both branches now go through a new `normalizeComponentName(input)` helper in `src/utils/registry.ts` that returns the registry's canonical `component.name` (so casing is always taken from the registry, never reconstructed from the kebab form), or `null` for unknown inputs. The two `processComponent` / `diffComponent` lookups use `toKebabCase` to defend against PascalCase inputs as well. (F-018)
- **Angular test-template lookup now uses kebab-case filenames on every filesystem.** `generateComponentTestContent` looked for `ButtonGroup.component.spec.ts.hbs` while the real template files are `button-group.component.spec.ts.hbs`. On case-insensitive macOS the lookup coincidentally succeeded; on case-sensitive Linux CI it fell through to the inline fallback generator, producing different tests per OS. The lookup now mirrors the Angular-aware branch already used for component and CSS template lookups. (F-025)
