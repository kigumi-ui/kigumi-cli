---
'kigumi': patch
---

### Fixed

The release changelog no longer collapses multi-line entries into a single
paragraph.

`post-changeset-version.ts` dropped every blank line while bucketing changeset
bodies into categories. Any entry longer than one paragraph came out glued
together, separate entries ran into each other, and a fenced code block lost the
blank line markdown requires on each side. The 1.0.0 release PR failed
`format:check` on exactly that.

Blank lines inside an entry are now preserved and collapsed to one. A blank line
between two single-line bullets is still dropped, so ordinary bullet lists stay
tight rather than rendering with paragraph spacing. The generated output is
asserted against prettier's own markdown formatter in the unit lane, so this
class of failure can no longer reach a release PR.
