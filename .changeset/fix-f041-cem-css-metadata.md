---
'kigumi': patch
---

### Fixed

- **CSS scaffolds now include parts and custom-properties for 64 of 74 components** (previously only 7). `scripts/css-metadata.ts` is now derived from Web Awesome's `custom-elements.json` on every `pnpm generate:metadata` instead of being hand-maintained, so generated `.css` files for React, Vue, and Angular ship with the accurate `::part()` and `--wa-*` reference block as comments. (F-041)
- **Stale Shoelace-era part names are fixed.** The hand-maintained entries referenced pre-WA-3.x part names (e.g. Button `prefix`/`suffix`) and leaked global theme tokens (`--wa-spacing-*`) into per-component scaffolds. Both are replaced by the authoritative CEM data (`start`/`end` for Button; no global tokens). (F-041)
- **Angular CSS scaffolds now contain their parts and custom-properties.** The Angular generator's lookup used the PascalCase `component.name` against the kebab-case `CSS_METADATA` map, silently dropping the comment block from every `*.component.css` file. The Angular generator now also emits the custom-properties section (with `(default: ...)` suffix where CEM declares one), matching the React and Vue output. (F-053)

### Changed

- **`validateCSSMetadataCoverage` removed from `scripts/validate-registry.ts`.** The warning was there to surface hand-maintained gaps; with CEM-derived data, "missing from map" now means "no CSS styling surface" (utility components like `wa-animation`, `wa-format-*`, `wa-*-observer`) and is expected. The validator is silent where it used to emit 67 warnings.
- **`pnpm generate:metadata` formats its output through prettier.** `JSON.stringify` emits raw double-quoted output, so the script's previous write path drifted against the committed prettier-formatted files on every re-run. Regeneration is now idempotent.
