---
'kigumi': patch
---

Replace all 32 raw `throw new Error(...)` in `src/` with typed error classes.

Raw errors reached `handleError` as `UnknownError`: exit code 1 regardless of
what failed, no semantic error code, and a generic "this is an unexpected
error" suggestion instead of an actionable one.

This fixes one user-visible bug along the way: cancelling an interactive
component picker threw a raw `Error`, so the CLI exited **1**. It now throws
`UserCancelledError` and exits **0**, as cancelling always should.

Adds `InternalInvariantError` for conditions that are unreachable if the
surrounding code is correct (these report as a Kigumi bug, not user error), plus
`RegistrySourceInvalidError` and `RegistryFetchError` for the registry paths.
`ValidationError` takes an optional message override and
`CommunityComponentNotFoundError` a `kind`, so themes no longer report as
"Component ... not found". All existing error messages are preserved.
