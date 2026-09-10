---
'kigumi': patch
---

### Removed

`templates/AGENTS.md` no longer ships in the npm tarball.

It is contributor documentation, not runtime input: every path it cites
(`../AGENTS.md`, `.claude/skills/`, `../../typecheck-shims/`) exists in the
repository and not in the package, so in a published install all of its links
dangle. The `files` array now names the three template directories explicitly
rather than all of `templates/`. A negation entry does not work here, because
pnpm ships the file anyway.

### Added

`validate:doc-links` fails the build when a relative markdown link points at a
path that does not exist.

A relative link is a claim that a file exists, and nothing verified those
claims. `.cursor/SKILLS.md` pointed at six skill files for six months after the
directory holding them was deleted, two skills sent readers to reference docs
that were never written, and three documents still pointed into
`docs/superpowers/`, removed when that workflow was retired.

External URLs, anchors, and links inside code blocks are deliberately not
checked: reaching the network makes the build flaky, and a link in a code
sample is syntax rather than a claim. `tests/fixtures/` is excluded, because a
fixture that links to a missing file is usually the point of the fixture.

### Fixed

Removed the dead `.cursor/SKILLS.md` index and the stale `docs/superpowers/`
references, including one in a `check:mocks` error message that sent developers
to a deleted design doc.
