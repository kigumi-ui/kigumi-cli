---
'kigumi': patch
---

### Fixed

- **Error messages now reference the current env var and config file names.** The `TokenRequiredError`, `TierRestrictionError`, `ProComponentRequiredError`, `ProThemeRequiredError`, and `AuthenticationError` (Web Awesome branch) suggestion steps previously referenced the old env var `WA_TOKEN`; they now use `WEBAWESOME_NPM_TOKEN`. The same classes, along with `ConfigNotFoundError`, `ConfigFieldMissingError`, `ConfigFieldInvalidError`, and the `kigumi theme set` spinner, previously referenced the old config filename `kigumi-components.json`; they now use `kigumi.config.json`. `TokenRequiredError.context.checked` now also lists `~/.npmrc` to match the real detection chain. Users who copy token-setup steps from error output will set the correct env var and look for the correct config file. (F-008, F-034, F-035)
