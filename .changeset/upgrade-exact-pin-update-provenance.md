---
'kigumi': patch
---

### Fixed

- **`kigumi upgrade` (pnpm)**: Web Awesome is pinned to the exact version again when `package.json` already listed it with a range. pnpm keeps an existing `^` or `~` even with `--save-exact`, so a project on `^3.6.0` ended up on `^3.13.0` and could drift to a Web Awesome release Kigumi was not built for. If the install fails, `package.json` is left as it was.
- **`kigumi update`**: a component brought up to date now records the current Kigumi version in `kigumi.config.json`, so `kigumi diff` shows the version it was updated to instead of the one it was first added with. A component left with conflicts, or skipped because it has no snapshot, keeps its old version.
