---
'kigumi': patch
---

### Fixed

- **Unreadable `package.json`**: When `package.json` exists but cannot be read (for example a permissions error, or a directory at that path), commands including `kigumi init` and `kigumi upgrade` now say which file is the problem and how to fix it, and exit with code 4. Previously they printed "An unexpected error occurred" and asked you to report a Kigumi bug.
- **Invalid `package.json`**: `kigumi init` and `kigumi upgrade` now report a `package.json` that is not valid JSON (or not a JSON object, such as `null`) as "Invalid package.json at ..." with exit code 4, instead of "An unexpected error occurred". Other commands still fall back to token-based tier detection for such a file, as before.
