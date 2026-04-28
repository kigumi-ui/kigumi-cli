---
'kigumi': patch
---

### Removed

- **Vestigial schema surface (F-060/061/064).** Three dead fields/exports dropped from the public config schema. `webAwesome.cdnUrl` (no runtime reader, intended for an unshipped CDN-install mode) is gone. `validatePartialConfig` (zero callers in `src/`, duplicated `validateConfig`'s error formatting) is deleted with its 5-test describe block. `config.aliases` (a 3-key map persisted by `init` and preserved on update, but read at runtime in exactly one place that did string-match-and-fallback gymnastics on the same value) is removed; `resolveImportBase` now returns `toKigumiAlias(config.componentsDir)` directly — same behavior with one less knob to drift. Configs carrying any of these fields lose them silently (Zod strips unknown keys); follow-up F-067 will surface that loudly via `.strict()`.

### Changed

- **`getConfig()` JSDoc and module header (F-063).** Removed the misleading "cached" descriptor — there is no caching anywhere in `src/utils/config.ts`; every call constructs a fresh cosmiconfig explorer. Wording now reflects the actual behavior: resolved configuration with defaults applied. F-033's one-call-per-command invariant makes runtime caching unnecessary.
- **`tierSchema` relocation (F-066).** Moved `tierSchema` and `type Tier` out of `src/schemas/config.ts` (which explicitly disclaims tier as a config field — "tier is NOT stored in config") and into `src/utils/tier.ts` next to `detectTier()` and `detectTierSync()`. Single source of truth: the Zod schema defines the type, runtime utilities live alongside it. Importers in `src/schemas/options.ts` updated; barrel re-export removed from `src/schemas/index.ts`.
