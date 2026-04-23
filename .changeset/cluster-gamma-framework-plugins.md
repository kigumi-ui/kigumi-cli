---
'kigumi': patch
---

### Removed

- **Deleted dead `src/frameworks/` plugin system.** The `FrameworkPlugin` interface, `FrameworkRegistry` class, and per-framework plugin classes (`ReactPlugin`, `VuePlugin`, `AngularPlugin`, `SveltePlugin`) had no production callers. Real component generation runs through `commands/add/installer.ts` → `utils/template.ts`; real framework detection uses `utils/detect-framework.ts`. Removing the directory eliminates ~1,212 lines of unreachable code and collapses the three duplicated `findPackageRoot` helpers to the single copy in `utils/template.ts`. (F-024, F-028)
- **Dropped `'svelte'` from the `framework` enum** in `kigumi.config.json` schema and community registry schemas. Svelte has never had templates or a working code path; schema validation now rejects `framework: 'svelte'` with a clear "Must be one of: react, vue, angular" error instead of failing deeper in the install flow with a confusing file-not-found. (F-029)
