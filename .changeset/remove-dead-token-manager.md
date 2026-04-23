---
'kigumi': patch
---

### Removed

- **Deleted unused `src/utils/token-manager.ts` module.** The module exported `loadTokenFromEnv`, `saveTokenToEnv`, `promptForToken`, and `isValidTokenFormat`, but had no runtime consumers; it was only referenced by its own test file. Its `.env` parser duplicated the canonical token detection in `src/utils/token.ts` and additionally matched the legacy `WA_TOKEN=` key, which the production detection chain (`detectProToken`) does not support. Removing the module eliminates the drift risk and the residual legacy alias. Token handling remains consolidated in `detectProToken` / `detectProTokenSync` (`$WEBAWESOME_NPM_TOKEN` → `~/.npmrc` → `.env` with `WEBAWESOME_NPM_TOKEN`). (F-011)
