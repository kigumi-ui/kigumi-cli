---
'kigumi': patch
---

### Removed

- **validate:changes**: Dropped the `class`/`className` anti-pattern. Its regex required the `<wa-` tag to appear after the attribute, so it matched nothing for months; catching the real case (multi-line JSX) needs an AST rule rather than a line regex.
- **validate:changes**: Dropped `checkTierLogic()`, an empty function that still ran on every invocation and still appeared in the script's documented check list, reading as coverage that did not exist.

### Fixed

- **validate:changes**: The script's header no longer advertises a `--fix` flag it never implemented, and its check list now matches what actually runs.

### Changed

- **validate:changes**: The anti-pattern matcher moved into a pure, exported `scanAntiPatterns()` function covered by table tests, so a rule that stops matching fails a test instead of reporting success. The script now also carries an import guard, which is what makes it testable at all, and scans `.tsx` alongside `.ts`.
