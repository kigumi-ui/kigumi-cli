---
'kigumi': patch
---

### Fixed

- **Unreadable `package.json`**: When `package.json` exists but cannot be read (for example a permissions error, or a directory at that path), commands including `kigumi init` and `kigumi upgrade` now say which file is the problem and how to fix it, and exit with code 4. Previously they printed "An unexpected error occurred" and asked you to report a Kigumi bug.
