---
'kigumi': patch
---

### Changed

Point `.changeset/config.json`'s `$schema` at `@changesets/config@4.0.0`, which
is what `@changesets/cli@3.0.2` now resolves. The URL is an editor hint only, so
nothing was broken, but a stale pointer sends editors to the wrong schema.
