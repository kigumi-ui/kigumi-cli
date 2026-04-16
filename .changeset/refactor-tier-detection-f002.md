---
'kigumi': patch
---

### Changed

- **`kigumi add` now detects tier exactly once per invocation.** The `add` flow previously called `detectTier()`/`detectTierSync()` three times -- once in `addFromBuiltinRegistry()`, again in `generateComponent()`, and a third time in `ComponentInstaller.updateKigumiImports()`. Each call re-read `package.json` and the token fallback chain (`~/.npmrc`, project `.env`) from disk. Tier cannot change mid-command, so the detected value is now resolved once in the command entry point and threaded through `ComponentInstaller` and `generateComponent()` as a parameter. `generateComponent()` keeps its legacy detection as a fallback for callers outside the add flow (update/diff, framework plugins) to remain backwards-compatible; the broader cleanup across all call sites is tracked separately. No user-visible change -- redundant I/O eliminated.
