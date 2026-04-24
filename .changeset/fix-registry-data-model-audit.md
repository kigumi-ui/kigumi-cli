---
'kigumi': patch
---

### Added

- **`kigumi add` warns when a component's registered dependencies are not installed.** Adding `select` without `option`, `carousel` without `carousel-item`, etc. used to render a visually broken component with no signal at install time. The installer now walks `component.dependencies` before the install loop and emits a single warning per requested component listing any missing deps, along with the exact `kigumi add …` command to fix them. The warning is informational only — the install proceeds and the dependencies are never auto-added, matching the CLI's "explicit user action" philosophy. Suppressed on re-runs where the parent is already installed. (F-020)
- **`pnpm validate:registry` now flags components without a `CSS_METADATA` entry in `scripts/css-metadata.ts`.** Missing entries cause the build-time template generators to emit `.css.hbs` templates without parts / custom-property comments. The check emits warnings (not errors) so adding a new component upstream does not block validation — the gap simply becomes visible. (F-023)

### Changed

- **Registry data model cleaned up.** `ComponentDefinition` no longer carries optional `events?/slots?/methods?` fields — those lived only in `src/utils/registry/types.ts` as dead decoration and were never read at runtime. Events, slots, and methods are produced by `scripts/parse-custom-elements.ts` into `src/utils/component-metadata.ts` and consumed there by the build-time template generators. `validate:cem-sync` now only checks key coverage between the registry and CEM instead of chasing 130+ false-positive drift warnings against the partial registry fields. (F-019)
