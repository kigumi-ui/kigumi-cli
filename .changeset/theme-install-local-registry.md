---
'kigumi': patch
---

**`theme install` accepts local registry paths.** `kigumi theme install <name> --from ../sibling-repo` failed with "Only GitHub URLs are supported" even though `kigumi add --from ../sibling-repo` has always accepted local paths. Theme installs now use the same source parser as component installs, so relative paths, absolute paths, and `~` paths all work.
