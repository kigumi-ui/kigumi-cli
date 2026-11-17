---
'kigumi': patch
---

### Fixed

- **init**: Re-running `kigumi init` in a project whose `kigumi.config.json` still has the `aliases` key that older versions wrote (the Starters do) no longer treats the config as invalid and rewrites it from scratch. `installedComponents`, `registries`, `installedThemes`, `aliases` and every other key init does not set itself are kept, so `kigumi diff` still shows the version each component was installed with and saved registries still work with `kigumi add --from`.
