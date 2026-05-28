---
'kigumi': patch
---

### Fixed

- **Test infrastructure: e2e smoke-test tier isolation.** The Free-tier smoke test in `tests/e2e/smoke.test.ts` did not clear `WEBAWESOME_NPM_TOKEN` or `KIGUMI_SKIP_GLOBAL_NPMRC` for the `kigumi init` / `kigumi add` subprocesses, so a developer running the suite locally with a Pro token configured globally would see `kigumi init` resolve to `@awesome.me/webawesome-pro` and the `dependencies['@awesome.me/webawesome']` assertion fail. CI runners have neither the token nor a global npmrc, so the failure was local-only. Adds a `FREE_TIER_ENV` constant (mirrors the integration-test helper) and threads it through every `kigumi` execa call in the file, including the Idempotency block.
