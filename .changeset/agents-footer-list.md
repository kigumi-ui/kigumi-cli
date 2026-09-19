---
'kigumi': patch
---

### Changed

- The `**Last Updated:**` footer in every AGENTS.md is now a bullet list instead
  of one long line. A single line made every pair of PRs touching the same
  AGENTS.md conflict on it, because git merges line by line and both sides
  rewrote the whole line. Each change is now its own bullet, so independent
  entries no longer collide. No content was lost: the 46 existing clauses were
  split verbatim and verified character-for-character against the originals.
