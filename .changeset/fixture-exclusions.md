---
'kigumi': patch
---

### Added

`validate:fixture-exclusions` fails the build when `.prettierignore`,
`eslint.config.js` or `tsconfig.tests.json` stops excluding
`tests/fixtures/starter-snapshots`. Those files are recorded CLI output, so a
formatter rewriting them silently invalidates every snapshot diff.
