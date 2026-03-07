---
'kigumi': minor
---

Add version pinning and migration system

Projects now track the Kigumi CLI version that generated them via a new `kigumiVersion` field in `kigumi.config.json`. This lets you control when you upgrade and ensures you don't accidentally pull in a Web Awesome dependency update you're not ready for.

**New commands:**

- `kigumi upgrade` — shows a migration guide when your project version differs from the CLI version: breaking changes, WA version changes, affected components, and recommended actions. Updates `kigumiVersion` in config when confirmed.
- `kigumi diff` — compares your installed component files against the current templates to see what's changed or locally modified before running `--overwrite`.
- `kigumi status` now shows the pinned `kigumiVersion` (or "not pinned" for existing projects).

**Version mismatch behavior on `kigumi add`:**

- Minor version mismatch (e.g. project on 0.11, CLI is 0.12): warning shown, command continues
- Major version mismatch (e.g. project on 1.x, CLI is 0.x): hard error with instructions to use `npx kigumi@{version}` or run `kigumi upgrade`

**Provenance tracking:** Each installed component now records its `kigumiVersion` in `installedComponents`, so `kigumi diff` can show which version it was generated with.

Existing projects without a pinned version continue to work without changes — all checks are backward-compatible.
