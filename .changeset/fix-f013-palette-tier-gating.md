---
'kigumi': patch
---

### Fixed

- **Free-tier projects can no longer select Pro palettes.** `TIER_RESTRICTIONS.palettes.free` incorrectly listed all 9 palettes, so `kigumi palette elegant` (or any of the other Pro palettes) on a free-tier project would write the palette to `kigumi.config.json` even though the Pro CSS was never loaded, so the runtime silently fell back to the default palette and the config was a lie. Free projects now see only `default`, `bright`, and `shoelace`, matching the Web Awesome free tier. Existing free-tier configs with a Pro palette value are silently reset to `default` on the next `kigumi init --force` via the pre-existing fallback path. (F-013)

### Changed

- **`PALETTE_OPTIONS` carries `pro: true` markers and a new `getPaletteOptionsForTier(tier)` helper**, matching the existing `THEME_OPTIONS` / `getThemeOptionsForTier(tier)` pattern. Internal utility; no surface change for generated projects.
