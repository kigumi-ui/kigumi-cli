---
'kigumi': major
---

### Changed

First stable release. Kigumi's CLI surface, its `kigumi.config.json` format and
the shape of the components it generates are now covered by semantic versioning:
a breaking change to any of them requires a major bump.

Nothing in this release breaks an existing project. 1.0.0 signals maturity, not
a rewrite. Commands, flags and config keep working as they did in the 0.27 line,
and the version reflects that the surface is settled enough to promise that.

Projects pinned to a 0.x `kigumiVersion` keep working against the 1.x CLI. You
will see a one-time warning suggesting `kigumi upgrade`, which pins the project
forward; nothing is required of you before then.
