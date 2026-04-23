---
'kigumi': patch
---

### Removed

- **Dead `src/schemas/tier.ts` module removed.** The file held a stale copy of tier-validation logic — `TIER_THEMES`, `AVAILABLE_PALETTES`, `AVAILABLE_BRAND_COLORS`, `PRO_COMPONENTS`, plus related Zod schemas and helpers — with invented theme/palette/component names that no longer (or never) matched the real Web Awesome registry. The module had zero runtime consumers; its only references were the re-export block in `src/schemas/index.ts` and its own test file `tests/unit/tier-schema.test.ts`, which validated the stale data and gave false confidence. Both are deleted, and the historical NOTE in `tests/unit/tier-consistency.test.ts` is trimmed to drop the "follow-up spec will remove it" pointer. Runtime tier logic continues to live in `src/utils/tier.ts` and registry-sourced `component.tier` fields. No public API change — the CLI package has no library exports. (F-010)
