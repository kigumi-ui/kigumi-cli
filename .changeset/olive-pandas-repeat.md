---
'kigumi': patch
---

### Fixed

- **Angular templates**: the CSS template emitter ignored a component's `docsUrl`. `generateCSSTemplate` existed three times, byte-identical in the React and Vue generators and a drifted third copy in the Angular one that hardcoded `https://webawesome.com/docs/components/<name>` instead of reading `docsUrl` from the metadata, so a component needing a non-standard documentation link was silently given the derived one. The Angular copy also omitted the "no custom properties defined" fallback and used a different comment format.

### Changed

- **Generators**: all three now call one emitter in `scripts/generator-utils.ts`, parameterised only by the selector block, which is the single genuine per-framework difference. Regenerates the 84 Angular CSS templates: comment-only changes, no CSS declarations affected.
