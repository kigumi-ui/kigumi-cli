---
'kigumi': patch
---

**Cached registry files now expire.** The one-hour cache lifetime was only ever checked on a code path the CLI does not use, so a component file downloaded from a community registry was served from disk indefinitely and `kigumi add --from` kept installing a stale copy. Cached files older than the lifetime are refetched.
