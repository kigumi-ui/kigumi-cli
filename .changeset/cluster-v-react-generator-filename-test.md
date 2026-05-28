---
'kigumi': patch
---

### Added

- **Test infrastructure: react generator filename catcher (cluster V follow-up).** Adds `tests/unit/scripts/generate-react-templates-output.test.ts`, which mocks `writeFormatted` and asserts that `generateComponentTemplates` writes exactly `<Name>.tsx`, `<Name>.css`, and `<Name>.test.tsx` for each component (paths derived verbatim from `component.name`, no transformations). Exposed via a one-line `export` on `generateComponentTemplates` in `scripts/generate-react-templates.ts`. Closes the test-suite gap identified during the Cluster V bug-injection gate — generator-filename mutations now turn a unit test red instead of silently producing orphan files alongside stale committed templates.
