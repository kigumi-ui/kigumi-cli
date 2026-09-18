---
'kigumi': patch
---

Add the `kigumi/no-raw-throw` lint rule, scoped to `src/`. A raw `Error`
reaches `handleError` as `UnknownError` and loses its semantic code, exit code
and suggestions. Internal tooling only, no change to CLI behaviour.
