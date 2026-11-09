---
'kigumi': patch
---

### Fixed

- **init**: Re-running `kigumi init` in a project whose `kigumi.config.json` still has the `aliases` key that older versions wrote (the Starters do) no longer treats the config as invalid and rewrites it from scratch. `installedComponents`, `aliases` and every other key init does not set itself are kept, so `kigumi diff` and `kigumi update` still find the installed components.
