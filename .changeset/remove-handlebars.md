---
'kigumi': minor
---

### Changed

- **Templates are now real framework source files, not Handlebars templates.** Every `.tsx.hbs`, `.jsx.hbs`, `.vue.hbs`, `.test.tsx.hbs`, `.component.ts.hbs`, etc. has been renamed to its non-`.hbs` counterpart. Tier substitution moved from `Handlebars.compile()` to a single `String.replaceAll(/@awesome\.me\/webawesome(?!-pro)/g, packageName)` call inside `materializeTemplate()`. End-user output is byte-identical: `kigumi add`, `kigumi update`, and `kigumi init` produce the exact same files as before. The change is internal to the rendering pipeline and to the contributor-side tooling (`tsc` and `eslint` now cover `templates/**`, so authoring mistakes fail at PR time instead of on user machines).

### Removed

- **`handlebars` removed from `dependencies`.** No longer needed at runtime or build time. CLI install footprint drops by the Handlebars runtime (~80 KB).
