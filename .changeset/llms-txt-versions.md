---
'kigumi': patch
---

**`llms.txt` reports the current versions.** The sample `kigumi status --json` payload still quoted kigumi 0.13.0 and Web Awesome 3.3.1, four minor releases behind. Corrected, and the version claims are now checked against `package.json` by `validate:generated-fresh` so they cannot drift again.
