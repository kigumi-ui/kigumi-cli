---
'kigumi': minor
---

### Added

- **Next.js support — App Router and Pages Router, with or without `src/`.** `kigumi init` now detects any Next.js project (via `next` in `package.json` or a `next.config.*` file) and adapts the scaffold:
  - **Router-aware**: App Router projects get an `app/providers.tsx` (or `src/app/providers.tsx`) `KigumiProvider` client module so root layout can stay a Server Component. Pages Router projects get a clear post-install instruction for wiring `pages/_app.tsx` manually — Kigumi does not modify user-owned files.
  - **Pages Router CSS policy handled automatically**: Next's Pages Router forbids global CSS imports outside `pages/_app.tsx`. Kigumi detects this at generation time and (a) omits `import '@/styles/layers.css';` from `lib/kigumi.ts` and (b) strips the per-component `import './<Name>.css';` line from each generated wrapper. Users add `layers.css` + `theme.css` + `@/lib/kigumi` directly to `_app.tsx` per the post-install instructions.
  - **Layout-aware**: projects with `src/` get the traditional `src/components/ui` / `src/lib` / `src/styles` layout; projects without `src/` (e.g. `create-next-app` without `--src-dir`) get the parallel `components/ui` / `lib` / `styles` layout so the default `@/*` tsconfig alias resolves without edits.
  - **Generator flow**: skips `vite.config.ts` / `vite-env.d.ts` writes, emits a sibling `web-awesome.d.ts` without the `vite/client` reference, and falls back to `tsconfig.json` for path-alias configuration when `tsconfig.app.json` is absent.
- **`'use client'` directive injection.** Generated React components and `src/lib/kigumi.ts` are emitted with a leading `'use client';` directive when a Next.js project is detected. Non-Next React projects are unaffected.
- **`.kigumi/cache/` added to the generated `.gitignore`.** The registry cache is transient and should not be committed. `.kigumi/snapshots/` stays tracked because `kigumi update`'s three-way merge depends on it.

### Changed

- **React templates now emit `suppressHydrationWarning` on the underlying `<wa-*>` element.** Lit-based Web Awesome components reflect default attributes (e.g., `appearance="outlined"`, `library="default"`) to the DOM during `connectedCallback`, causing React hydration mismatch warnings on Next.js / any SSR setup. `suppressHydrationWarning` is the documented React API for elements whose attributes mutate after hydration via a runtime — it suppresses only the host element (children are still hydration-checked), and it is a no-op in non-SSR contexts, so Vite-React SPAs see no change.
- **Next.js is treated as a React variant**, not a separate `framework` enum value. `config.framework` stays `'react'`; the Next-specific branches read `isNextProject(cwd)`, `detectNextRouter(cwd)`, and `detectSourceLayout(cwd)` at generation time, so the existing 74 React component templates are reused as-is for both routers and both layouts.
