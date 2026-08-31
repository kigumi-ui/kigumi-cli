---
'kigumi': patch
---

### Added

`validate:gha-permissions` fails the build when a workflow job that runs
`actions/checkout` declares its own `permissions:` block without a readable
`contents:` scope. Job-level permissions replace the workflow-level ones rather
than merging, so a missing `contents: read` silently breaks checkout.
