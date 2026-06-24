# PLAN: Web Awesome 3.5.0 → 3.6.0 Bump

Phased roadmap mirroring SPEC.md. All phases implemented on branch `worktree-wa-3.6.0-bump`.

## Phase 1 — Bump dependency + regenerate lockfiles

- Edit four version references to exact `3.6.0` (root `package.json`, `src/constants.ts`,
  `docs/package.json`, `docs/kigumi.config.json`).
- `(cd docs && pnpm install)` **first** — lands the 3.6.0 Pro CEM under `docs/node_modules`.
  Requires `docs/.npmrc` + `WEBAWESOME_NPM_TOKEN` (gitignored / from `.env`; copy `.npmrc` into
  the worktree and source `.env` before installing).
- Verify `docs/node_modules/@awesome.me/webawesome-pro/package.json` reads `3.6.0`.
- `pnpm install` at root.
- Leave `src/utils/version-map.ts` and historical "WA 3.5.0+" comments unchanged.

### pnpm store hygiene (gotcha)

`scripts/find-cem.ts` picks the **highest** `@awesome.me+webawesome-pro@*` dir in the pnpm
store (`.sort().reverse()`). A leftover 3.9.0 from an initial caret install poisoned metadata
generation. Fix: pin docs **exactly**, then `(cd docs && pnpm prune)` to evict the stale
version so only 3.6.0 remains, then regenerate. (The highest-version selection itself is a
latent fragility — tracked as a finding.)

## Phase 2 — Regenerate CEM metadata + detect drift

- `pnpm generate:metadata` (regenerates `src/utils/component-metadata.ts` + `scripts/css-metadata.ts`).
- `pnpm validate:cem-sync`.
- Authoritative drift = direct `dist/custom-elements.json` diff of the 3.5.0 vs 3.6.0 Pro
  tarballs (see SPEC "Overview"), not the committed-baseline diff (which conflated stale drift).

## Phase 3 — Surface size tokens across mirrors

- Registry: widen 18 `size` props to the full CEM union (keep `default: 'medium'`).
- `pnpm generate:templates`.
- Patch starter-snapshot fixtures deterministically (size union + dialog `--backdrop-filter`).
- Docs stories: widen 18 size option arrays; add `onBeforeinput` argType + arg to NumberInput.
- Docs UI wrappers: widen 18 size unions; add `onBeforeinput` to the NumberInput wrapper.

## Phase 4 — Validate end-to-end

`pnpm build`, `pnpm validate:all`, `pnpm test`, `pnpm type-check`, `pnpm lint`,
`(cd docs && ./node_modules/.bin/tsc -p tsconfig.app.json --noEmit)`, `kigumi doctor` spot-check.

## Phase 5 — Drift guard + changeset + PR

- Harden `validate:cem-sync` with enum prop-value drift detection (+ `findCustomElementsJsonSync`
  in `scripts/find-cem.ts`, + unit tests, + `REGISTRY_VALUE_ALLOWLIST`).
- `pnpm changeset` (minor).
- Update `src/AGENTS.md` (validate:cem-sync behavior).
- Log new findings to the backlog (`~/.claude/projects/kigumi-cli-overview.md`).
- Draft PR; mark Ready for Review for Chromatic (templates + stories changed).
- Leave `version-map.ts` for the release step.
