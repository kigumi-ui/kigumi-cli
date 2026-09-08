---
'kigumi': patch
---

### Added

The Claude PreToolUse hook now denies file edits and commits while the session
is on the default branch, pointing at the worktree workflow CLAUDE.md requires.
Reads are unaffected, and `KIGUMI_ALLOW_MAIN=1` overrides it for the release
flow, which legitimately commits on `main`.
