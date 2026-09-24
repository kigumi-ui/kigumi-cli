---
'kigumi': patch
---

### Fixed

- **Tier detection**: `detectTier` and `detectTierSync` only ignore invalid JSON when reading `package.json`. Other read failures, such as a permissions error or a directory at that path, propagate instead of being treated as "no package installed".
