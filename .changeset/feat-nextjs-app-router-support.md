---
'kigumi': minor
---

### Added

- **Next.js App Router support.** `kigumi init` now detects `next` in `package.json` and adapts the output: skips `vite.config.ts`/`vite-env.d.ts` generation, emits `src/web-awesome.d.ts` (without the `vite/client` reference), writes an `app/providers.tsx` `KigumiProvider` client module, and falls back to `tsconfig.json` for path-alias configuration when `tsconfig.app.json` is absent.
- **`'use client'` directive injection.** Generated React components and `src/lib/kigumi.ts` are emitted with a leading `'use client';` directive when a Next.js project is detected. Non-Next React projects are unaffected.

### Changed

- **React templates now emit `suppressHydrationWarning` on the underlying `<wa-*>` element.** Lit-based Web Awesome components reflect default attributes (e.g., `appearance="outlined"`, `library="default"`) to the DOM during `connectedCallback`, causing React hydration mismatch warnings on Next.js / any SSR setup. `suppressHydrationWarning` is a no-op in non-SSR contexts, so Vite-React SPAs see no change.
- **Next.js is treated as a React variant**, not a separate `framework` enum value. `config.framework` stays `'react'`; the Next-specific branches read `isNextProject(cwd)` at generation time, so the existing 75 React component templates are reused as-is.
