---
'kigumi': patch
---

### Added

- **Lint**: `kigumi/no-cross-command-import`. Commands are leaf nodes: shared code belongs in `src/utils/`, never in a sibling command's directory. Internal tooling only, no change to CLI behaviour.
