---
'kigumi': patch
---

### Fixed

- **Cancellation**: cancelling an interactive component picker exited 1 instead of 0. It threw a raw `Error`, so the CLI reported a failure status to any calling script. It now throws `UserCancelledError` and exits 0, as cancelling always should.

### Changed

- **Errors**: replaced all 32 raw `throw new Error(...)` in `src/` with typed error classes. Raw errors reached `handleError` as `UnknownError`: exit code 1 regardless of what failed, no semantic error code, and a generic "this is an unexpected error" suggestion instead of an actionable one.

### Added

- **Errors**: `InternalInvariantError` for conditions that are unreachable if the surrounding code is correct (these report as a Kigumi bug, not user error), plus `RegistrySourceInvalidError` and `RegistryFetchError` for the registry paths. `ValidationError` takes an optional message override and `CommunityComponentNotFoundError` a `kind`, so themes no longer report as "Component ... not found". All existing error messages are preserved.
