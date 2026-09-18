---
'kigumi': patch
---

### Fixed

- **CI**: run the workflow on every pull request, not only those targeting `main`. A stacked PR whose base is another PR's branch received no CI at all, so a stack could only be verified by merging it.
