---
'kigumi': patch
---

### Fixed

- **`getConfig()` now deep-merges nested config objects with defaults.** Previously a shallow spread (`{ ...DEFAULT_CONFIG, ...userConfig }`) caused partial `theme`, `webAwesome`, or `aliases` config in `kigumi.config.json` to silently lose default values. A user config with `{ theme: { selected: "awesome" } }` lost `palette` and `brandColor` defaults; a user config with partial `aliases` lost the other default entries. `getConfig()` now delegates to `mergeWithDefaults()`, which deep-merges these nested objects and additionally validates the result against the Zod schema -- surfacing invalid configs that previously passed silently. Unknown top-level properties not declared in the schema are now stripped from the resolved config.
