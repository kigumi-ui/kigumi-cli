---
'kigumi': patch
---

### Fixed

- **Release flow**: `pnpm version` now bumps the sample `kigumi status --json` payload in `llms.txt` alongside `AGENTS.md`. It only ever synced `AGENTS.md`, so every release produced a release PR whose CI failed on `validate:generated-fresh` check E until someone hand-edited the file. Only the CLI's own version is rewritten; the nested Web Awesome version keeps tracking Web Awesome.
- **validate:generated-fresh**: The Web Awesome half of check E was inert. It read the pin from `pkg.dependencies`, but Web Awesome sits in `devDependencies`, so the version it compared against was always the empty string and its guard could never be true. It now reads both blocks and catches a drifting Web Awesome version in `llms.txt`.
