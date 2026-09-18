---
'kigumi': patch
---

### Added

- **Lint**: `kigumi/no-raw-throw`, scoped to `src/`. A raw `Error` reaches `handleError` as `UnknownError` and loses its semantic code, exit code and suggestions. Internal tooling only, no change to CLI behaviour.
