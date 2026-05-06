---
'kigumi': patch
---

### Changed

- **`pnpm build` no longer duplicates `templates/` into `dist/` (F-042).** The runtime always read templates from package root via `findPackageRoot`; the `dist/templates/` and `dist/llms.txt` copies emitted by `scripts/post-build.ts` were dead weight that bloated every install by ~5 MB. `scripts/post-build.ts` is removed and the `build` script is now plain `tsup`.
- **`tsup.config.ts` is now a single config with an entry map (F-043).** Replaces the previous two-config array whose order was load-bearing: only the first config had `clean: true`, so swapping the entries silently wiped the prior build. The new config emits `dist/index.js`, `dist/index.d.ts`, and `dist/bin.js` with the shebang preserved. tsup additionally emits content-hashed `chunk-*.js` / `install-*.js` helpers alongside the entries because both share imports; they ship together in the tarball (which still drops by ~5 MB net thanks to F-042).

### Fixed

- **`component-metadata.ts` is regenerated when stale (F-044).** The `prebuild` step previously only regenerated when the file was missing, so bumping `webawesome-pro` and running `pnpm build` without first running `pnpm generate:metadata` silently shipped wrappers missing the upgraded CEM's new props and events. The new `scripts/check-metadata-freshness.ts` compares mtimes between the CEM and the generated metadata; either staleness or absence triggers regen. `findCustomElementsJson` was lifted into `scripts/find-cem.ts` so the parser and the freshness check share a single implementation.
- **`pnpm audit --audit-level=critical` now blocks the maintenance workflow (F-049).** Previously ran with `continue-on-error: true`, so critical advisories produced a green checkmark. Trivy stays as defense-in-depth; pnpm audit catches transitive-dep advisories Trivy misses.
