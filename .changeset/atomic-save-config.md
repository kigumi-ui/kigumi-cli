---
'kigumi': patch
---

### Fixed

- **Config**: Kigumi now replaces `kigumi.config.json` (or the `kigumi` key in `package.json`) in one step when a command saves it, instead of rewriting the file in place. Two `kigumi` commands saving at once, or a save stopped with Ctrl-C or a full disk, could leave the file empty or with a stray tail that is no longer valid JSON. The file keeps its permissions, and a symlinked config is written through to its target.
