---
'kigumi': patch
---

### Changed

- **CI: `pnpm typecheck:templates` is now a Quality Checks gate.** Every PR runs three checks in order: `tsc` against `templates/react/tsconfig.json`, then `vue-tsc` against `templates/vue/tsconfig.json`, then `tsc` against `templates/angular/tsconfig.json`, catching template-level type errors at PR time instead of at user-install time. No change to generated component output.
