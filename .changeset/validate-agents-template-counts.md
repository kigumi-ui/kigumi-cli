---
'kigumi': patch
---

### Fixed

`templates/AGENTS.md` claimed "a single set of 80 React templates" while the
real count was 84. `validate:agents` now checks component-count claims in that
file, which is the one AGENTS.md no validator previously opened.
