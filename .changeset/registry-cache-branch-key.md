---
'kigumi': patch
---

**Registry cache keys now include the branch.** Two branches of the same registry repository shared one cache directory, so fetching from `owner/repo` and from `owner/repo/tree/staging` would overwrite each other's cached `registry.json` and component files. Each branch now caches independently.
