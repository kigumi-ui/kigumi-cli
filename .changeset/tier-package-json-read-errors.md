---
'kigumi': patch
---

### Fixed

- **Tier detection**: Tier detection only ignores a `package.json` that is invalid (not valid JSON, or valid JSON that is not an object, such as `null`) and falls back to the Pro token for it. Other read failures, such as a permissions error or a directory at that path, are reported instead of being treated as "no package installed".
