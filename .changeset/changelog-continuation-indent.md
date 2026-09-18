---
'kigumi': patch
---

### Fixed

- The changelog post-processor no longer strands a wrapped bullet body at four
  spaces. Changesets nests each entry one level deeper, so a continuation line
  written at two spaces arrives at four; the de-indent step only matched a
  non-whitespace character, so the bullet dropped to the margin while its
  continuation stayed behind. `prettier --check` rejected the result and failed
  CI on the 1.0.3 release PR. Continuation lines now land at markdown's
  list-continuation level.
