---
'kigumi': patch
---

### Added

Internal ESLint plugin scaffold (`tools/eslint-plugin-kigumi`) with a
RuleTester harness running in the existing unit-test lane. No lint rules are
enabled yet; this is the foundation the upcoming `class`-not-`className`,
listener-cleanup and typed-error rules build on.
