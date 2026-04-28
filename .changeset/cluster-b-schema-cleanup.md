---
'kigumi': patch
---

Remove vestigial schema surface: drop unused `webAwesome.cdnUrl`, unused `validatePartialConfig` export, misleading "cached" JSDoc in config utils, dead `config.aliases` map (import path is now auto-derived from `componentsDir`), and relocate `tierSchema` from `schemas/config.ts` to `utils/tier.ts` (single source of truth).

Behavior change: configs with custom `aliases` lose them silently (the field had no runtime effect). Custom `webAwesome.cdnUrl` is also dropped.
