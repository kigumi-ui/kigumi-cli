---
'kigumi': patch
---

### Fixed

- **Error messages now reference the current env var and config file names.** The `TokenRequiredError`, `TierRestrictionError`, `ProComponentRequiredError`, `ProThemeRequiredError`, and `AuthenticationError` (Web Awesome branch) suggestion steps previously referenced the old env var `WA_TOKEN`; they now use `WEBAWESOME_NPM_TOKEN`. The same classes, along with `ConfigNotFoundError`, `ConfigFieldMissingError`, `ConfigFieldInvalidError`, the `kigumi theme set` spinner, and the docs-site troubleshooting page, previously referenced the old config filename `kigumi-components.json`; they now use `kigumi.config.json`. `TokenRequiredError.context.checked` now lists all three detection sources in priority order (`process.env.WEBAWESOME_NPM_TOKEN` → `~/.npmrc` → `.env`) to match `src/utils/token.ts`. Users who copy token-setup steps from error output will set the correct env var and look for the correct config file. (F-008, F-034, F-035, F-036)
