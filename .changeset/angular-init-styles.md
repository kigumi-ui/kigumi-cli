---
'kigumi': patch
---

### Fixed

- **Angular init**: `kigumi init --framework=angular` no longer writes a setup file that fails `ng build` (and, on Angular 22, `ngc`) because it imported `layers.css` through an `@/` alias `ng new` never sets up. Kigumi now adds `layers.css` to the `styles` in `angular.json`, the Angular `kigumi.ts` imports no CSS, and `init` prints `import './lib/kigumi';` for `src/main.ts`. Running `kigumi theme`, `brand` or `palette` in an existing Angular project applies the same change.
