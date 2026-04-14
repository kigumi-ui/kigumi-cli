---
'kigumi': patch
---

### Fixed

- **`getConfig()` now deep-merges nested config objects with defaults.** Previously a shallow spread (`{ ...DEFAULT_CONFIG, ...userConfig }`) caused partial `theme` or `webAwesome` config in `kigumi.config.json` to silently lose default values. A user config with `{ theme: { selected: "awesome" } }` lost `palette` and `brandColor` defaults, producing `undefined` downstream. `getConfig()` now delegates to `mergeWithDefaults()`, which deep-merges nested objects and additionally validates the result against the Zod schema -- surfacing invalid configs that previously passed silently.
