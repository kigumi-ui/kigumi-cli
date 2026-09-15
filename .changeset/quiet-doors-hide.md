---
'kigumi': patch
---

### Fixed

- **`doctor` / `init`**: user-facing output (doctor's issue details, init's post-install summary) was silently discarded because it went through `output.log()`, which only emits when `DEBUG` is set. Those call sites now use `output.info()`, and the debug-only method has been renamed to `output.debug()` so this misuse can't recur silently.
