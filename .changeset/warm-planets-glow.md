---
'kigumi': patch
---

### Fixed

- **validate:changes**: Removed `checkImportPaths`, a mixed free/pro import check that globbed `src/components/**`, a directory that never exists in this repo. It always matched zero files and could never report an error; mixed-import detection remains fully covered by `kigumi doctor` against real consumer trees.
