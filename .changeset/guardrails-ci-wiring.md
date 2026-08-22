---
'kigumi': patch
---

### Fixed

- **CI**: Five validators now gate pull requests. `validate:changes`, `validate:stories`, `validate:parity`, `validate:agents` and `validate:cem-sync` ran only via `pnpm validate:all` or inside a local Claude session, so a human-authored PR bypassed them entirely. Each is now its own named step in the quality job, so a failure points at the check that failed.
- **tests/AGENTS.md**: Restored the missing `theme-install-local-source.test.ts` entry. Its absence made `validate:agents` fail on a clean tree, which is why the check could not be wired into CI before now.
- **llms.txt**: The sample `kigumi status --json` payload claimed version 0.26.0 against a 0.27.0 package.
