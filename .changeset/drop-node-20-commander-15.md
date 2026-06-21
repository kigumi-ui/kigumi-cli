---
'kigumi': minor
---

### Changed

- **Minimum Node.js is now 22.12.0 (Node 20 dropped).** Commander 15 (the CLI argument parser) and lint-staged 17 both require Node >= 22.12, so the supported runtime floor moves up. `engines.node` is now `>=22.12.0`, the runtime guard in the `kigumi` binary refuses older versions, and CI runs on Node 22. Node 20 and 21 users must upgrade to Node 22.12 or later.
- **`commander` upgraded to 15 and `lint-staged` to 17.** As a side effect of Commander 15's negatable-option change, `kigumi init` without an explicit `--typescript` / `--no-typescript` flag now resolves TypeScript from project detection (non-interactive) or the "Use TypeScript?" prompt (interactive) instead of always defaulting to TypeScript. Passing either flag is unchanged.
