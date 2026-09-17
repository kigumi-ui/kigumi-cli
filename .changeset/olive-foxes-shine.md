---
'kigumi': patch
---

### Fixed

- `kigumi init` no longer crashes on React and Vue projects whose code lives beside `package.json` instead of under `src/`. Both frameworks aborted partway with `ENOENT: no such file or directory` on `src/vite-env.d.ts` (React) or `src/env.d.ts` (Vue), leaving `components/`, `lib/`, `styles/` and `kigumi.config.json` written but the type declarations missing, under an "unexpected error, please report this" message. Next.js was already correct and Angular was never affected, so this aligns the two broken paths with the behaviour Next.js already had: root layout writes the declaration to the project root, `src` layout writes it to `src/`.
- Two independent defects produced that crash. `file-generator.ts` threaded the detected layout into the Next.js branch but passed a hardcoded `'src'` to the Vite branch, discarding it; and `configureVueTypes` hardcoded `src/env.d.ts` and did not accept the layout at all. `configureVueTypes` now takes an optional `sourceLayout` argument, defaulting to `'src'` so existing callers are unaffected.
- The three declaration writers (`generateViteEnvDts`, `generateNextEnvDts`, `configureVueTypes`) now create the target directory before writing. All three wrote into a directory they never created; Next.js escaped the crash only because it honoured the layout, so the gap was latent there too.

Not a breaking change for existing projects: these three functions are called only by `init`, never by `upgrade`, `update`, `add` or `doctor`. A `src`-layout project gets exactly what it got before. One residual worth knowing: anyone who hit the crash and hand-wrote `src/vite-env.d.ts` will, on a later `init`, get a declaration in the project root and leave the hand-written one orphaned. No damage, just a stray file.

### Added

- An end-to-end regression test runs `init` across all four framework/layout combinations and asserts both the exit code and where the declaration landed. Exit codes alone are not enough: with the layout hardcoded but the directory created, `init` exits 0 and silently writes a stray `src/vite-env.d.ts` into a project that has no `src/`. 1745 unit tests and 31 integration tests passed while two of these four combinations crashed, because every existing test created the directory first and no fixture covered a root-layout project.
- The `init` section of the README now documents `--components-dir`, `--utils-dir`, `--styles-dir`, `--framework`, `--typescript`, `--no-install` and `--yes`, and explains that Kigumi follows the project's existing layout. Only `npx kigumi init` was shown before.
