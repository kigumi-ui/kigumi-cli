# Dogfood Report: kigumi@0.20.0

**Date:** 2026-06-20
**Artifact:** `kigumi@0.20.0` installed from the public npm registry (not the local build).
**Tier:** Pro (token in `~/.npmrc`, cloudsmith `webawesome-pro` registry).
**Scope:** React (Vite) + Next.js (App Router /src, Pages Router). Vue/Angular out of scope by choice.
**Method:** Real `npm i -D kigumi@0.20.0` into fresh scaffolds; full command lifecycle as a real user; `tsc --noEmit` as the build/acceptance proxy on each project.

## Verdict: GO — 0.20.0 is usable in the real world

Core workflows are solid across React and both Next.js routers. All three generated projects type-check clean. Four quality/UX findings surfaced (F-146 to F-149); none block basic usage. F-146 (Web Awesome version drift) is the most worth fixing.

## Results by project

### P1 — React + Vite — PASS

| Step                                   | Result                                                              |
| -------------------------------------- | ------------------------------------------------------------------- |
| `init` (real install)                  | ✅ installed `@awesome.me/webawesome-pro@^3.9.0`, tier detected Pro |
| `add button input card dialog` (Free)  | ✅ wrappers generated, `class` not `className`, dynamic `import()`  |
| `add combobox color-picker` (Pro-only) | ✅ generated, import from `@awesome.me/webawesome-pro`              |
| `list` / `status`                      | ✅ Tier: pro, 74 components (see F-147, F-149)                      |
| `diff button` after edit               | ✅ `Button.tsx — locally modified` detected                         |
| `update`                               | ✅ three-way merge **preserved the local edit**                     |
| `upgrade`                              | ✅ "Already up to date (0.20.0)"                                    |
| `doctor`                               | ⚠️ 1 manual-action issue (see F-146)                                |
| `brand red` / `palette bright`         | ✅ applied (see F-148 re `--yes`)                                   |
| `tsc --noEmit` (final)                 | ✅ exit 0                                                           |

### P2 — Next.js App Router (with `src/`) — PASS

- `init` ✅ — `src/app/providers.tsx` generated, `lib/kigumi.ts` is `'use client'`.
- `add` ✅ — `Button.tsx` is `'use client'`, **includes** `./Button.css` import (correct for App Router).
- `tsc --noEmit` ✅ exit 0.

### P3 — Next.js Pages Router (no `src/`) — PASS

- `init` ✅ — **no** `providers.tsx`, clear manual `pages/_app.tsx` wiring instructions, explains the global-CSS-only-from-`_app` policy.
- `lib/kigumi.ts` correctly **omits** the `layers.css` import (only a comment explaining why) — global CSS left to `_app.tsx`.
- `add` ✅ — `Button.tsx` **omits** the `./Button.css` import (correct for Pages Router).
- `tsc --noEmit` ✅ exit 0.

## Findings

- **F-146 (bug, medium) — Web Awesome floats away from the version kigumi is built against.** `init` writes `webAwesome.version: "^3.5.0"` into `kigumi.config.json`, and because that is a `^` range (and the installer relied on the package manager's default save-prefix), the install resolves the newest matching WA (`@awesome.me/webawesome-pro@3.9.0`) into `package.json`. `kigumi doctor` then reports "1 issue requires manual action" and advises `npm install @awesome.me/webawesome-pro@3.5.0`. **The correct framing is the opposite of a stale version-map: kigumi 0.20.0 is conformant to WA 3.5.0, so `doctor`'s advice is right and the bug is that `init` floated off 3.5.0 in the first place.** The fix is to pin WA **exactly** to 3.5.0 (version-map `0.20.0` entry, exact versions, config builder reading the map, installer `--save-exact`), never to bump kigumi to an unvalidated WA 3.9.0. (Related: `feedback-version-map-must-match-release`.) **Fixed in PR #191.**
- **F-147 (bug, low) — `status` shows "Tier: pro" and "Token: Not found" at once.** Tier resolves correctly to Pro (from the installed `webawesome-pro` package), but the Token line reports "Not found" because the check does not recognise the `~/.npmrc` cloudsmith `webawesome-pro` authToken (it looks for `WEBAWESOME_NPM_TOKEN`). Misleading for a correctly-configured Pro user. **Fixed in PR #191.**
- **F-148 (quality, low) — `brand` / `palette` reject `--yes`.** `kigumi brand red --yes` fails with `error: unknown option '--yes'`, while `init` / `add` / `update` / `upgrade` accept it. Flag-surface inconsistency. (Both commands work without `--yes`; `palette` validates values with a helpful message.) **Fixed in PR #191.**
- **F-149 (quality, low) — `list` does not distinguish Free vs Pro.** All 74 components render identically (`○`); a Free-tier user cannot tell which require Pro from `kigumi list`. (On Pro tier they were also indistinguishable.) **Fixed in PR #191** (`[Pro]` badge on Pro tier).

## Limitations (no silent caps)

- Acceptance proxy was `tsc --noEmit` on each project, **not** a full bundler build (`vite build` / `next build`). The Pages Router global-CSS policy was verified by file inspection rather than a failing/​passing `next build`. Generated wrappers were not imported into a page and rendered at runtime.
- Vue and Angular were out of scope by choice.
- One-shot manual dogfood; not wired into CI.
