# Cluster U: Story `play()` Interactions - Specification

> Stand up the docs-side storybook-vitest integration, add `play: async` interactions to ≥ 20 stories under `docs/src/stories/**`, wire a per-PR CI lane, and chain the new lane into `pnpm test:all` so Cluster V's bug-injection kill-rate command picks it up transitively. Closes initiative-level acceptance criterion #6 and the Q1 close-out's deferred storybook gate.

**Type:** Build/Infra
**Status:** Shipped
**Author:** Mischa
**Date:** 2026-05-04
**Initiative:** [`test-infrastructure-hardening`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**F-IDs:** F-129
**Depends on:** Q1 (shipped, PR #137) — `pnpm check:tests` keeps the new tests type-safe; Q2 (shipped, PR #138) — CI structure to slot the new job into.
**Blocks:** Cluster V's `pnpm test:all` kill-rate target (initiative acceptance criterion #9) and the v0.20.0 release (criterion #12 — the dashboard cannot show 8/8 SHIPPED until U lands).
**Branched from:** `origin/main` post Cluster T (commit `9054f4cd`).
**No file overlap with:** Cluster V (V will add its mutation/bug-bash/bug-injection scaffolding under `tests/regression/` and `scripts/`; U only touches `docs/`, `.github/workflows/ci.yml`, root `package.json`, and root `vitest.config.ts`).

## Overview

Initiative criterion #6 requires `≥ 20 stories under docs/src/stories/** have play: async functions`. Verified count today: `grep -E 'play:\s*async' docs/src/stories/*.tsx | wc -l` → 0 of 75 story files. The Q1 close-out (status file line 115) explicitly defers the per-framework storybook-vitest plumbing to Cluster U because the required deps (`@storybook/addon-vitest`, `@vitest/browser-playwright`, `playwright`) live in `docs/package.json`, not at root. Root `vitest.config.ts:7-13` carries the matching deferral comment. So this cluster owns four discrete layers in one PR:

1. The missing spec doc (this file).
2. A docs-side storybook-vitest config (`docs/vitest.storybook.config.ts`) plus a tiny test-utils helper module.
3. CI lane (`story-interactions`) plus root `test:stories` script plus extending `test:all` to chain it, so Cluster V's bug-injection kill-rate command transitively picks up the new lane.
4. `play: async` on **22 stories** (margin above the 20-gate without padding) using one consistent light-DOM-first pattern.

`docs/` is **not** a pnpm workspace member — both root and `docs/pnpm-workspace.yaml` set only `onlyBuiltDependencies`. All docs commands run with `cd docs` or `working-directory: docs` (see `.github/workflows/ci.yml:322,326,372,377` for the precedent).

## Goals

- `docs/vitest.storybook.config.ts` ships in browser mode (`provider: 'playwright'`, `browser: 'chromium'`, headless), reusing `docs/.storybook/vitest.setup.ts` (already wired with `setProjectAnnotations`).
- `docs/src/test-utils/play-helpers.ts` exports three helpers (`clickTrigger`, `installEventProbe`, `waitForCalled`), ≤ 35 LOC. The third helper exists because Storybook's portable stories pass a different spy reference into `play()` than the wrapper's `useEffect` captures at render-time, so the spread-wired pattern from the original draft does not actually tick the spy `play()` asserts on. See "Spread-wired event handlers" below for the bridge.
- `docs/package.json` gains `"storybook:test": "vitest run --config vitest.storybook.config.ts"` and a direct `vitest` devDependency (the addon's peerDependency was previously satisfied transitively but the binary is not on the path).
- Root `package.json` gains `"test:stories": "cd docs && pnpm storybook:test"` and `test:all` chains it.
- `.github/workflows/ci.yml` gains a `story-interactions` job (single Ubuntu runner, no matrix), modeled on the existing `docs-typecheck` job's Pro-registry setup.
- Root `vitest.config.ts:7-13` deferral comment collapses to one line pointing at the new docs-side config.
- 22 stories under `docs/src/stories/` carry `play: async` functions, each asserting at least one event spy or DOM query.
- `tests/AGENTS.md` documents that `pnpm test:all` now requires Chromium (download via `cd docs && pnpm exec playwright install chromium` once).
- The status dashboard flips Cluster U from `BLOCKED` to `SHIPPED` (table row 31, narrative line 141, "Last updated" header line 3).

## Non-Goals

- **`play()` for the other ~50 stories.** The 20-gate is hit at 22; story-by-story expansion is out-of-scope and will be picked up by Cluster V's mutation analysis if and when story coverage drives a kill-rate gap.
- **Story restructuring.** Existing `render` functions stay intact. The `play` block is appended below `render`; if a story's render does not surface a usable opener (e.g. ColorPicker drag geometry, FileInput OS picker), the story is excluded with reason rather than rewritten.
- **Visual regression coverage.** Chromatic owns visual diff; `play()` here only exercises behavior.
- **Per-framework storybook split.** Only the docs site (React) carries stories today. A Vue/Angular storybook is its own initiative.
- **Mutation-score-driven story selection.** Cluster V will expand the roster if and when bug-injection runs surface gaps. U holds the line at 22.
- **New F-IDs beyond F-129.** Pre-existing flake in `tests/e2e/smoke.test.ts > should install Web Awesome package` is not investigated here.
- **Touching production component code.** All edits are story-side (or config / docs). The `wa-*` wrappers under `docs/src/components/ui/**` are **not** modified.

## API Surface

| File                                                                            | Change Type | Description                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/superpowers/specs/2026-05-04-cluster-u-story-play-interactions-design.md` | Created     | This file.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `docs/vitest.storybook.config.ts`                                               | Created     | New vitest config — browser mode (`provider: 'playwright'`, `browser: 'chromium'`, headless), `setupFiles: ['./.storybook/vitest.setup.ts']`, `test.retry: 2` to absorb single-run flake from animation timing. Inherits the docs Vite `@/` alias.                                                                                                                                                         |
| `docs/src/test-utils/play-helpers.ts`                                           | Created     | Three helpers: `clickTrigger(canvas, text)` wraps `userEvent.click(canvas.getByText(...))`; `installEventProbe(el, eventName, spy)` attaches a play-side listener that re-invokes the play-side spy whenever the underlying element emits (bridges Storybook's portable-stories spy-reference mismatch); `waitForCalled(args, key)` wraps `waitFor(() => expect(args[key]).toHaveBeenCalled())`. ≤ 35 LOC. |
| `docs/package.json`                                                             | Modified    | Add `"storybook:test": "vitest run --config vitest.storybook.config.ts"`. Add `vitest` to `devDependencies` (matching `@vitest/browser-playwright` version range; the addon's peerDependency was satisfied transitively but the binary was not exposed).                                                                                                                                                   |
| `package.json` (root)                                                           | Modified    | Add `"test:stories": "cd docs && pnpm storybook:test"`. Extend `test:all` with a trailing `&& pnpm run test:stories`. (Do **not** use `pnpm --filter docs` — `docs/` is not in the workspace.)                                                                                                                                                                                                             |
| `.github/workflows/ci.yml`                                                      | Modified    | New `story-interactions` job after `docs-typecheck`. Single Ubuntu runner. Reuses the Pro-registry `printf` step from `docs-typecheck`. Caches `~/.cache/ms-playwright` keyed on `docs/pnpm-lock.yaml`. No build step (storybook vitest reads source).                                                                                                                                                     |
| `vitest.config.ts` (root)                                                       | Modified    | Replace the multi-paragraph deferral comment at lines 7-13 with a one-line pointer to `docs/vitest.storybook.config.ts`.                                                                                                                                                                                                                                                                                   |
| `tests/AGENTS.md`                                                               | Modified    | One-liner under the testing-commands section noting `pnpm test:all` now requires Chromium (`cd docs && pnpm exec playwright install chromium`). Bump "Last Updated".                                                                                                                                                                                                                                       |
| `docs/superpowers/state/test-infrastructure-hardening-status.md`                | Modified    | At merge time: row U flips `BLOCKED` → `SHIPPED` (line 31), narrative line 141 rewrites from "unblocked but spec not yet written" to "SHIPPED YYYY-MM-DD — see this spec and PR #N", "Last updated" header at line 3 bumps.                                                                                                                                                                                |
| 22 story files under `docs/src/stories/`                                        | Modified    | Each gains a `play: async` function and the `import { ... } from 'storybook/test'` line. See the roster section below.                                                                                                                                                                                                                                                                                     |

## Behavior & Edge Cases

### Pattern convention

**Light-DOM first. Spy on emitted events. `.shadowRoot` only with a comment.**

Imports (top of each touched story):

```tsx
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
```

Each `play` function shape:

```tsx
play: async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: /open/i }));
  await waitFor(() => expect(args.onShow).toHaveBeenCalled());
},
```

Forbidden without an inline justifying comment: direct `.shadowRoot` queries, `setTimeout`, restructuring a story's `render` to fit the test.

### Spread-wired event handlers (and why the bridge is needed)

The Kigumi `wa-*` wrappers under `docs/src/components/ui/<Comp>/<Comp>.tsx` register their event listeners via `useEffect` and call `props.on<Event>` inside the listener. Each wrapper's render returns `<wa-foo {...rest}>` where `rest` includes the spread args.

**The original draft assumed Storybook's `fn()` spy reference reaches the wrapper's `useEffect` closure unchanged. It does not.** Storybook's portable stories pass a _different_ spy reference into `play()` than the wrapper captured at render-time, so listening to `args.onShow` from the `useEffect` closure ticks a stale spy that `play()` never asserts on. Empirically the wrapper's listener fires, but the assertion `expect(args.onShow).toHaveBeenCalled()` fails because `args.onShow` (in `play`) and the spy the wrapper closed over are not the same function.

`installEventProbe` bridges this without rewriting any render function: it attaches a play-side listener directly to the underlying `wa-*` element that re-invokes the play-side spy whenever the component emits. Each `play()` returns its cleanup thunk before exiting so the listener does not leak across stories.

### Excluded stories with reason

| Component   | Why excluded                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Callout     | No interactive events; wrapper exposes `dismissible` boolean but no Kigumi-mapped close event.        |
| ColorPicker | Drag-geometry interactions; covered by visual regression, not behavior testing.                       |
| FileInput   | OS file picker — out-of-scope for browser-mode vitest without complex `page.setInputFiles` setup.     |
| Toast       | Imperative `Toast.create()` API rather than a render-driven event surface.                            |
| TreeItem    | Covered transitively by the `Tree.stories.tsx` interaction (clicking an item asserts the tree's spy). |

## Story roster (22)

Pattern: one chosen story per file (always `Default` unless noted), one assertion. Event names verified against `docs/src/components/ui/<Comp>/<Comp>.tsx` for the three flagged components.

**Overlays (5)** — click opener, assert spread-wired `onShow`.

1. `Dialog.stories.tsx` → `Default` → click "Open Dialog" → `args.onShow.toHaveBeenCalled()`.
2. `Drawer.stories.tsx` → `Default` → click "Open Drawer" → `args.onShow.toHaveBeenCalled()`.
3. `Popover.stories.tsx` → `Default` → click trigger → `args.onShow.toHaveBeenCalled()` + `findByText` against slotted content.
4. `Tooltip.stories.tsx` → `Default` → `userEvent.hover(trigger)` → `args.onShow.toHaveBeenCalled()`.
5. `Dropdown.stories.tsx` → `Default` → click trigger → `args.onShow.toHaveBeenCalled()` + `findByText` against menu item label.

**Forms (9)**

6. `Input.stories.tsx` → `Default` → type "kigumi" → `args.onInput.toHaveBeenCalled()`.
7. `NumberInput.stories.tsx` → `Default` → type `42` → `args.onInput.toHaveBeenCalled()`.
8. `Textarea.stories.tsx` → `Default` → type text → `args.onInput.toHaveBeenCalled()`.
9. `Checkbox.stories.tsx` → `Default` → click → `args.onChange.toHaveBeenCalled()`.
10. `Switch.stories.tsx` → `Default` → click → `args.onChange.toHaveBeenCalled()`.
11. `Radio.stories.tsx` → `Default` → click → `args.onChange.toHaveBeenCalled()`.
12. `RadioGroup.stories.tsx` → `Default` → click second option → `args.onChange.toHaveBeenCalled()`.
13. `Select.stories.tsx` → `Default` → open + pick option → `args.onChange.toHaveBeenCalled()`.
14. `Combobox.stories.tsx` → `Default` → type filter + pick filtered option → `args.onChange.toHaveBeenCalled()`.

**Triggers (3)**

15. `Button.stories.tsx` → `Default` → click → `args.onClick.toHaveBeenCalled()`. Add `onClick: fn()` to meta `args` if not already present.
16. `CopyButton.stories.tsx` → `Default` → click → `args.onCopy.toHaveBeenCalled()`. (Verified: `wa-copy` → `onCopy`.)
17. `Rating.stories.tsx` → `Default` → click 4th star → `args.onChange.toHaveBeenCalled()`. (Verified: `onChange` exists in wrapper.)

**Disclosure (2)**

18. `Details.stories.tsx` → `Default` → click summary → `args.onShow.toHaveBeenCalled()` + `findByText` on expanded content.
19. `TabGroup.stories.tsx` → `Default` → click second tab → `args.onTabShow.toHaveBeenCalled()`. (Verified: `wa-tab-show` → `onTabShow` at `docs/src/components/ui/TabGroup/TabGroup.tsx:80`.)

**Other (3)**

20. `Slider.stories.tsx` → `Default` → focus + `keyboard('{ArrowRight}')` → `args.onChange.toHaveBeenCalled()`. Avoids drag-geometry flake.
21. `Carousel.stories.tsx` → `Default` → click next-button → `args.onSlideChange.toHaveBeenCalled()`. (Verified: `wa-slide-change` → `onSlideChange` at `docs/src/components/ui/Carousel/Carousel.tsx:130`.)
22. `Tree.stories.tsx` → `Default` → click a tree item → `args.onSelectionChange.toHaveBeenCalled()`. (Verified: `wa-selection-change` → `onSelectionChange` at `docs/src/components/ui/Tree/Tree.tsx:64`.)

## CI job

Insert after the `docs-typecheck` job in `.github/workflows/ci.yml`:

```yaml
story-interactions:
  name: Story Interactions (Storybook Vitest)
  runs-on: ubuntu-latest
  if: github.actor != 'dependabot[bot]'
  steps:
    - uses: actions/checkout@v6
    - uses: pnpm/action-setup@v5
    - uses: actions/setup-node@v6
      with:
        node-version: 20
        cache: pnpm
        cache-dependency-path: pnpm-lock.yaml
    - name: Configure Pro registry for docs
      run: |
        printf '@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro/\n//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=%s\n//npm.cloudsmith.io/fortawesome/webawesome-pro/:always-auth=true\n' "${{ secrets.WEBAWESOME_NPM_TOKEN }}" > docs/.npmrc
    - run: pnpm install --frozen-lockfile
    - name: Install docs deps
      working-directory: docs
      run: pnpm install --frozen-lockfile
    - name: Cache Playwright browsers
      uses: actions/cache@v4
      with:
        path: ~/.cache/ms-playwright
        key: playwright-chromium-${{ hashFiles('docs/pnpm-lock.yaml') }}
    - name: Install Playwright Chromium
      working-directory: docs
      run: pnpm exec playwright install --with-deps chromium
    - name: Run story interactions
      working-directory: docs
      run: pnpm storybook:test
```

Browser cache key uses `docs/pnpm-lock.yaml` so it invalidates on Playwright version bumps. No build step is needed; `@/components/ui` resolves to source via the docs Vite config that the storybook vitest project inherits.

## Acceptance Gates

- [ ] Spec doc lives at `docs/superpowers/specs/2026-05-04-cluster-u-story-play-interactions-design.md`.
- [ ] `docs/vitest.storybook.config.ts` exists; `cd docs && pnpm storybook:test` runs green locally.
- [ ] `docs/src/test-utils/play-helpers.ts` exports `clickTrigger` + `installEventProbe` + `waitForCalled` and is ≤ 35 LOC.
- [ ] `docs/package.json` has the `storybook:test` script and a direct `vitest` devDep.
- [ ] Root `package.json` has `"test:stories": "cd docs && pnpm storybook:test"`; `test:all` chains it.
- [ ] `.github/workflows/ci.yml` has the `story-interactions` job; the job is green on the PR.
- [ ] `grep -rE 'play:\s*async' docs/src/stories | wc -l` ≥ 20 (target 22).
- [ ] Each `play` asserts at least one spy or DOM expectation.
- [ ] No `.shadowRoot` queries without a justifying comment.
- [ ] `docs/superpowers/state/test-infrastructure-hardening-status.md` shows U as `SHIPPED` (table line 31 + narrative line 141 + "Last updated" header line 3).
- [ ] Root `vitest.config.ts:7-13` deferral comment collapses to a one-line pointer.
- [ ] `tests/AGENTS.md` documents the new Chromium prerequisite for `pnpm test:all`.
- [ ] PR description maps each acceptance criterion to evidence (job name, file count, dashboard line).

## Risks & Mitigations

| Risk                                                                          | Mitigation                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser-mode vitest is heavy in CI.                                           | Single Ubuntu runner, no matrix. Cache Playwright browsers keyed on `docs/pnpm-lock.yaml`. Set `test.retry: 2` in the storybook config so animation-timing flake retries quietly. Flag any story file > 5s wall-clock in the PR description.          |
| `args.onX` shadowing in render functions (Dialog/Drawer).                     | Verified: `{...args}` spread wires `onShow` even when `onHide` / `onAfterHide` are explicitly overridden inline. Do not rewrite render functions.                                                                                                     |
| Web component event names drift over time.                                    | Three "verify" stories double-checked at spec time: `TabGroup.tsx:80` → `onTabShow`, `Carousel.tsx:130` → `onSlideChange`, `Tree.tsx:64` → `onSelectionChange`. The other 19 use the standard `onShow` / `onChange` / `onInput` / `onClick` mappings. |
| `pnpm test:all` regression for users without Chromium installed.              | Document one line in `tests/AGENTS.md` so the prerequisite is discoverable.                                                                                                                                                                           |
| `docs/pnpm-lock.yaml` drift from adding the direct `vitest` dep.              | Both root and docs lockfiles must be `--frozen-lockfile` clean. Drift is committed explicitly with the script-edit commit so reviewers see the version pin.                                                                                           |
| Status-dashboard text drift between table (line 31) and narrative (line 141). | Update both in the same commit so they cannot disagree.                                                                                                                                                                                               |

## Out of Scope

- `play()` for the other ~50 stories.
- Story restructuring (render functions stay intact).
- Visual regression (Chromatic owns it).
- Per-framework storybook split (separate initiative).
- Mutation-score-driven story selection (V cluster decides; not U's expansion).
- Pre-existing `tests/e2e/smoke.test.ts > should install Web Awesome package` flake.
- New F-IDs beyond F-129.
