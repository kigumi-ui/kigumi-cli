---
'kigumi': minor
---

### Changed

- **`wa-dropdown-item` `variant` corrected to match Web Awesome.** The accepted values are now `default` and `danger` (default `default`); the previously advertised `neutral` was never accepted by Web Awesome and has been removed.
- **`wa-scroller` `orientation` corrected to match Web Awesome.** The accepted values are now `horizontal` and `vertical` (default `horizontal`); the previously advertised `both` was never accepted by Web Awesome and has been removed.

### Fixed

- **CEM resolution now honours the pinned Web Awesome version.** `scripts/find-cem.ts` (and the duplicate resolver in `scripts/generate-skill-references.ts`) selected the highest `@awesome.me/webawesome-pro` version present in the pnpm store rather than the version pinned in `docs/package.json`. A stale higher version left in the store could silently contaminate generated metadata. Resolution now matches the pinned version exactly and only falls back to highest-wins when no pin is resolvable.
- **The `validate:cem-sync` drift guard now enforces the two reconciled enums.** With `dropdown-item.variant` and `scroller.orientation` corrected, their entries were removed from `REGISTRY_VALUE_ALLOWLIST`, so any future regression on these values fails the build instead of being downgraded to a warning.
