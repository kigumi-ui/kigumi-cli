---
'kigumi': minor
---

### Removed

- **Hand-rolled `src/types/web-awesome.d.ts`**: `kigumi add` no longer writes a second, hand-rolled TypeScript declaration file for `wa-*` elements. The file produced by `kigumi init` — `src/vite-env.d.ts` for Vite projects, `src/web-awesome.d.ts` for Next.js — imports `CustomElements` and `CustomCssProperties` directly from the Web Awesome package and already covers every `wa-*` tag with full prop, event, ref, and `CSSProperties` typing. The old file was a strict subset of those types and caused TypeScript to merge two incompatible `IntrinsicElements` shapes when both existed.
- **Dead `updateViteEnvTypes()`**: `kigumi add` no longer invokes the regex-based inserter on `src/vite-env.d.ts`. The function guarded on a legacy `auto-managed` comment that the modern `init`-generated file never contains, so it already bailed out silently on every real project.
- **Orphan `templates/react/vite-env.d.ts.hbs`**: Template was never rendered — `init` writes the file from a string literal. Deleted.

### Changed

- **`kigumi doctor` advisory**: For React+TS projects, `doctor` now flags any remaining `src/types/web-awesome.d.ts` and tells the user to delete it. The file is never auto-removed so hand edits survive.
- **Troubleshooting doc**: "TypeScript errors on wa-\* elements" entry now points to `vite-env.d.ts` / `web-awesome.d.ts` and suggests running `kigumi doctor` to find stale legacy files.

### Migration

If your project has `src/types/web-awesome.d.ts` from an older Kigumi version, run `npx kigumi doctor` to confirm it is the obsolete one, then delete it. The official Web Awesome types in `src/vite-env.d.ts` (or `src/web-awesome.d.ts` for Next.js) cover every `wa-*` element.
