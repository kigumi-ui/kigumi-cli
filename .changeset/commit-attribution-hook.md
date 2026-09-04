---
'kigumi': patch
---

### Added

A husky `commit-msg` hook that rejects AI attribution trailers
(`Co-Authored-By: Claude`, `Generated with ...`) before they enter the git
history. Prose mentioning Claude is deliberately still allowed, since the
history legitimately discusses Claude hooks and sessions.
