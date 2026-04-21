---
'kigumi': minor
---

### Added

- **Next.js App Router support**: `kigumi init` now detects Next.js (via `deps.next` or `next.config.{js,ts,mjs,cjs}`) and scaffolds `src/global.d.ts` with the Web Awesome JSX augmentation instead of `src/vite-env.d.ts`. Post-install output includes a router-aware import snippet — `Add to app/layout.tsx` for the App Router, `Add to pages/_app.tsx` for the Pages Router, `Add to src/main.tsx` for Vite.
- **Meta-framework detection**: New `detectMetaFramework()` (`'next' | 'vite' | 'none'`) and `detectNextRouter()` (`'app' | 'pages' | 'unknown'`) in `src/utils/detect-framework.ts`. `kigumi.config.json` gains an optional, informational `metaFramework` field — not used to branch template rendering.
- **Two-tier React wrapper split**: 74 React templates are now classified by their CEM events. Components without events (34 of 74) are generated as pure `forwardRef` pass-throughs that are safe to render inside Next.js Server Components. Components with events (40 of 74) emit `'use client';` on line 1 and keep the existing `useRef` + `useImperativeHandle` + `useEffect` pattern. Inspired by shadcn/ui's per-component client-boundary policy.
- **Drift-audit tests**: `tests/unit/template-tier-classification.test.ts` asserts every template matches its CEM-derived tier (Tier 1 has no hooks and no `'use client';`; Tier 2 starts with `'use client';`). `tests/unit/template-render-smoke.test.ts` renders every React template through the real pipeline and feeds the output to TypeScript's parser to catch syntax regressions.

### Changed

- **Presentational wrapper refs**: For the 34 components now in Tier 1 (Badge, Divider, Spinner, Card, Skeleton, Callout, Toast, Markdown, Page, ProgressBar, ProgressRing, FormatBytes/Date/Number, all chart variants, etc.), `ref.current` is the underlying `<wa-*>` element itself. The exported `XRef` name is still available as a type alias (`export type BadgeRef = WaElement`), so existing `useRef<BadgeRef>(null)` declarations continue to type-check.
- **Tier-2 templates (40 components)** now emit `'use client';` on line 1. In Vite projects this is a no-op at runtime but produces a Rollup `MODULE_LEVEL_DIRECTIVE` warning — `kigumi init` prints an `onwarn` snippet users can drop into `vite.config.ts` to silence it. No `kigumi add` output changes for Vite users beyond that warning.

### Breaking

- **`ref.current.element` is removed on Tier 1 components.** Call methods and read state on `ref.current` directly. Example:

  ```tsx
  // Before
  const ref = useRef<BadgeRef>(null);
  ref.current?.element?.focus();

  // After
  const ref = useRef<BadgeRef>(null); // BadgeRef is now = WaElement
  ref.current?.focus();
  ```

- **Wrapper-specific methods on Tier 1 components are gone** (Toast's `create`, Markdown's `renderMarkdown` / `getMarked` / `updateAll`, Page's `visiblePixelsInViewport` / `showNavigation` / `hideNavigation` / `toggleNavigation`). The native `<wa-*>` elements expose the same methods — call them on `ref.current` directly. The migration note is duplicated on each affected wrapper's `XRef` type alias comment for IDE discovery.

- **Tier 2 wrappers are unchanged** at the API level: `ref.current.element` still works, all event props still work, all `useImperativeHandle`-exposed methods still work.

Existing Kigumi projects that re-generate their wrappers (via `kigumi update --force` or a fresh `kigumi add`) will pick up the new shapes. Projects that stay on their current v0.19 snapshots continue to work unchanged against this CLI release — the breaking change only applies when wrappers are regenerated. See the Upgrading guide in the docs for the full migration.
