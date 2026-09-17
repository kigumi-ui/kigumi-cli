---
'kigumi': patch
---

### Fixed

- `release-readiness` can now reach a GO verdict. The gate required pending
  changesets and a version ahead of the last tag at the same time, but
  `pnpm run version` consumes the changesets to produce the bump, so no state
  in a normal release satisfied both. It now recognises the pre-bump and
  post-bump states as sound, and reports NO-GO only when there is genuinely
  nothing to release or the version is behind the tag (compared by semver
  precedence rather than string equality).
- The Pack Test smoke job no longer pre-creates `src/` or pins `--components-dir`,
  so `kigumi init` runs its own source-layout detection as a real user's project
  would. The job now asserts the type declaration was written and follows the
  layout `init` detected. Previously it satisfied a precondition production does
  not, and stayed green throughout the releases that shipped the root-layout
  ENOENT crash.
