---
'kigumi': patch
---

### Changed

- **`kigumi add` now loads `kigumi.config.json` exactly once per invocation.** The previous flow called `loadConfig()` and then `getConfig()`, but `getConfig()` internally calls `loadConfig()` — so the command ran two cosmiconfig searches for the same file. The redundant direct call has been removed; the resolved config and all pre-flight check behavior are unchanged. Internal cleanup with no user-visible change other than a marginally faster start for the `add` command.
