---
'kigumi': patch
---

### Changed

- **`kigumi palette`, `brand`, `theme`, `theme install`, `theme set`, `registry connect`, `registry remove`, and `registry list` now load `kigumi.config.json` exactly once per invocation.** Each of these eight command entry points called `loadConfig()` and then `getConfig()`, but `getConfig()` internally calls `loadConfig()` — so every command ran two cosmiconfig searches for the same file. The redundant direct call has been removed across all eight; resolved config and pre-flight check behavior are unchanged. Internal cleanup with no user-visible change other than a marginally faster start. Mirrors the earlier `kigumi add` fix.
