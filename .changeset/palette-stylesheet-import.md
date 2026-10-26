---
'kigumi': patch
---

### Fixed

- **Palettes**: `kigumi palette <name>` now takes effect. `layers.css` imports the selected palette's stylesheet after the theme; before, only `default` (and a palette the selected theme happens to load itself) changed any color, since Web Awesome scopes every other palette to its `wa-palette-<name>` class. Run `kigumi doctor` to add the import to an existing `layers.css`, or `kigumi palette <name>` to regenerate it.
