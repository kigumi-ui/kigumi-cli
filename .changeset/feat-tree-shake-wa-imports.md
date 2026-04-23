---
'kigumi': minor
---

### Changed

- **Tree-shakeable WA component imports**: Generated wrappers now load their Web Awesome JS via a mount-triggered dynamic `import()` instead of a top-level side-effect import. Each component becomes its own async chunk, so bundlers (Webpack, Rollup, Vite, Turbopack) can drop unused components from route bundles. First visit to a route that uses a component pays one async fetch per new component; WA's `:not(:defined) { visibility: hidden }` covers the brief gap before registration. Applies to React (.tsx + .jsx), Vue (.vue TS + JS), and Angular wrappers. Run `kigumi update` to regenerate existing wrappers.

### Removed

- **Dead `updateKigumiImports()`**: `kigumi add` no longer calls `updateKigumiImports()` on the installer — the method looked for a `// Import Web Awesome components` marker that hasn't been emitted into `kigumi.ts` by the generator in many releases, so it was a silent no-op. Components register themselves on mount now.
