---
'kigumi': patch
---

### Fixed

`kigumi add` no longer refuses to run in projects created before 1.0.0.

The version check treats a differing major as fatal. Every 0.x project pins a
major of 0, so a 1.x CLI hard-failed in all of them with `VersionMismatchError`
before doing any work. Since 1.0.0 marked the surface stable rather than
changing it, that blocked every existing project for a release that broke
nothing.

A 0.x project on a 1.x CLI now warns and proceeds, pointing at
`kigumi upgrade` to pin the project forward. Later major jumps stay fatal.
