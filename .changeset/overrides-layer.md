---
'kigumi': minor
---

### Added

- **Styles**: A Kigumi project gets `overrides.css` next to `theme.css`, for custom CSS rules no `--wa-*` token expresses. `layers.css` imports it last, into a new `overrides` cascade layer after `theme`, so a rule there beats the same rule in `theme.css` whatever their specificity. On the Next.js Pages Router, which drops the layers, it wins by coming later, so give it at least the same specificity. Like `theme.css`, the file is yours: Kigumi creates it once and never overwrites it.
- **Upgrade**: `kigumi init`, `theme`, `brand`, `palette` and `kigumi upgrade` create `overrides.css` when it is missing. In an existing `layers.css` they add the layer in place, right after its `theme.css` import, and leave the rest of the file as it is. If your `layers.css` has no `theme.css` import, Kigumi warns and names the line to add.

### Changed

- **Next.js Pages Router**: The setup instructions import only `layers.css` and `@/lib/kigumi` in `pages/_app.tsx`. `layers.css` already imports `theme.css` and `overrides.css`, so a separate `theme.css` import is redundant and can go.
