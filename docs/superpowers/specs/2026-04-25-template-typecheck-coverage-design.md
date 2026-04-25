# Template Typecheck & Lint Coverage — Specification

> Make `templates/**` first-class TypeScript: `tsc` (or `vue-tsc`) and ESLint validate every template file as the framework source it now is, in CI on every PR.

**Type:** Build/Infra
**Status:** Draft
**Author:** Mischa
**Date:** 2026-04-25
**Kigumi Version:** 0.19.2 (post-PR #121)

## Overview

PR #121 detemplated the wrapper layer: every `.tsx.hbs` / `.vue.hbs` / `.component.ts.hbs` is now a real `.tsx` / `.vue` / `.component.ts` file. ESLint scope was extended to `templates/**` in the same PR, but **TypeScript coverage** of those files was deferred — `react`, `vue`, `@angular/core`, `@awesome.me/webawesome` etc. are not in `package.json`, so `tsc --noEmit` cannot resolve their imports. Vue SFCs were also kept on the eslint-ignore list because `vue-eslint-parser` is missing.

That's the original PR #71 (Angular rollout) bug class still partially open: type-level mistakes in templates fail on **user machines** at install time, not at PR time. PR #121 closed half the door (syntax errors caught by ESLint); this spec closes the other half (type errors caught by `tsc` / `vue-tsc`, plus Vue SFC lint coverage).

The change is mechanical at the configuration layer — install dependencies, add per-framework tsconfigs with project references, configure `vue-eslint-parser`, wire a CI step. The non-trivial part is that turning on strict typecheck will surface **pre-existing template bugs** (the Vue boolean-prop filter from F-068, the React 19 `RefObject<HTMLElement>` mismatch, the `suppressHydrationWarning` issue on `<wa-button>` in the Next/React build). Those have to be fixed first — strict-on-day-one is a non-starter unless we accept landing a red CI.

## Goals

- **Templates type-check on every PR.** `pnpm typecheck:templates` (new script) runs `tsc -b` for React + Angular and `vue-tsc -p templates/vue/tsconfig.json` for Vue, integrated into the existing `Quality Checks` CI job.
- **Vue SFCs lint on every PR.** `templates/vue/**/*.vue` removed from `eslint.config.js` ignore list; `vue-eslint-parser` configured for those files.
- **Zero pre-existing-bug noise in green CI.** Bugs surfaced by enabling typecheck are fixed (or explicitly suppressed with a tracked `// @ts-expect-error` + F-XXX reference) before the CI job is enforced. No "remember to fix later" flags.
- **No surprise dep cost.** Document the `node_modules` size delta and the CI cache strategy so reviewers can evaluate the trade-off without surprises.
- **Pro tier doesn't need a token in CI.** Templates contain only the Free package literal `@awesome.me/webawesome`; the Pro rewrite happens at materialize time (PR #121's `materializeTemplate`). `tsc` only needs the Free package installed.

## Non-Goals

- **Angular template-string typecheck** (`@Component({ template: \`<wa-button [attr.pill]="..."` />\` })`). That requires the Angular Compiler / `ngc` against a real Angular workspace setup. Bigger lift; defer to a future PR. tsc-against-the-class-file still catches the most common authoring mistakes (decorator misuse, wrong types, missing imports), which is the 80/20.
- **Test-template typecheck under vitest globals.** Vitest typings can be loaded via `tsconfig.compilerOptions.types` to make `describe` / `it` / `expect` resolvable. In scope. But running the test templates as actual tests (= installing them into a project and running them) stays at the integration-test layer, not in this typecheck script.
- **Pro-package import resolution.** `@awesome.me/webawesome-pro` never appears in template source — only at materialize time. No reason to install it for typecheck. (Its module surface mirrors free anyway.)
- **Storybook / docs site coverage.** Already covered by `docs/tsconfig.json` and the docs CI checks.
- **Migrating root tsconfig to project references.** The root `tsconfig.json` continues to cover `src/**` only. The new template tsconfigs are siblings, not children — `pnpm type-check` (existing) and `pnpm typecheck:templates` (new) run independently. Reasoning: project references would force a `tsbuildinfo`/composite cascade that nothing in `src/` currently needs, and slow down the existing fast `tsc --noEmit` on the CLI itself.

## API Surface

This is Build/Infra — the "API" is what changes for contributors and CI.

### Affected Scripts

| Script                                          | Change Type | Description                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `package.json` `scripts`                        | Modified    | Add `"typecheck:templates": "tsc -b templates/react templates/angular && vue-tsc --noEmit -p templates/vue/tsconfig.json"`                                                                                                                                                           |
| `package.json` `scripts.type-check`             | Modified    | Becomes `"tsc --noEmit && pnpm typecheck:templates"` (so the existing combined check still works)                                                                                                                                                                                    |
| `package.json` `devDependencies`                | Modified    | Add: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `clsx`, `@testing-library/react`, `vue`, `vue-tsc`, `vue-eslint-parser`, `@testing-library/vue`, `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/compiler`, `rxjs`, `tslib`, `@awesome.me/webawesome` |
| `templates/react/tsconfig.json`                 | Created     | React-specific tsconfig: `jsx: "react-jsx"`, `lib: ["ES2022", "DOM"]`, `strict: true`, includes `*.tsx`/`*.jsx`/`*.test.tsx`/`*.test.jsx`, `composite: true`, `noEmit: true`                                                                                                         |
| `templates/vue/tsconfig.json`                   | Created     | Vue-specific tsconfig (consumed by `vue-tsc`): includes `*.vue`/`*.ts`, `types: ["vitest/globals"]`                                                                                                                                                                                  |
| `templates/angular/tsconfig.json`               | Created     | Angular-specific tsconfig: `experimentalDecorators: true`, `useDefineForClassFields: false`, `lib: ["ES2022", "DOM"]`, includes `*.component.ts`/`*.spec.ts`                                                                                                                         |
| `eslint.config.js`                              | Modified    | Remove `templates/vue/**/*.vue` from `ignores`; add a config block keying off `vue-eslint-parser` for `*.vue` files                                                                                                                                                                  |
| `.github/workflows/ci.yml` `Quality Checks` job | Modified    | Add step "Type-check templates" running `pnpm typecheck:templates` after the existing `TypeScript strict check`                                                                                                                                                                      |
| `templates/AGENTS.md`                           | Modified    | Add section documenting the typecheck story so contributors know `tsc` / `vue-tsc` runs against templates and how to debug failures                                                                                                                                                  |

### Pipeline Changes

Today's CI Quality Checks job:

```
1. Lint              (pnpm lint)
2. Format check      (pnpm format:check)
3. TypeScript strict (npx tsc --noEmit)   <-- src/ only
4. Validate Registry (pnpm validate:registry)
5. Validate Templates (pnpm validate:templates)
```

After this PR:

```
1. Lint              (pnpm lint)                     <-- now also lints Vue SFCs
2. Format check      (pnpm format:check)
3. TypeScript strict (npx tsc --noEmit)              <-- still src/ only
4. Type-check templates (pnpm typecheck:templates)   <-- NEW: react + vue + angular
5. Validate Registry
6. Validate Templates
```

CI runtime delta: ~15-30s for the new typecheck step (3 frameworks, ~75 components, cached node_modules). Cold-cache install delta: ~30-60s for the larger pnpm install (mostly Angular). Both are within tolerance of the current quality-job timing (~33s today).

## Behavior & Edge Cases

- **What happens when a template has a real type error?** CI fails on the new step. Local repro: `pnpm typecheck:templates`. The error points at the `templates/<framework>/<Component>/<file>` that fails — same as a normal TS error. Author fixes the template, regenerates if needed via `pnpm tsx scripts/generate-<framework>-templates.ts`, re-runs.

- **What happens when a template imports a path that exists in Pro but not Free?** Templates always import from `@awesome.me/webawesome` (the free literal that materialize swaps to `-pro`). If a Pro-only component template references a path the free package doesn't export, `tsc` errors. Two options: (a) the registry's `tier` flag for that component is wrong (templates for Pro components shouldn't import from free paths), or (b) the WA free package is missing the type definitions for a path that does exist in both. Likely (a); fix is metadata correction. Spec assumes (a) is rare and surfaces case-by-case during Phase 2 of the plan.

- **What happens when `node_modules` lacks the framework deps locally?** `pnpm install` is the developer's job. The first contributor pulling main after this lands runs `pnpm install` and gets the new packages. CI uses `actions/setup-node` cache keyed on `pnpm-lock.yaml`, so cold-install is paid once per lockfile change, not per CI run.

- **What happens to the pnpm tarball?** `package.json#files` whitelists `dist`, `templates`, `llms.txt`, `README.md`. `node_modules` is never in the published tarball. New devDeps are dev-only.

- **What happens when a contributor adds a new template and forgets typecheck?** Quality hook (`.claude/hooks/stop-quality-check.sh`) currently runs `type-check` on changed files. Updating the hook to also run `typecheck:templates` when files under `templates/**` change is a small follow-up — out of scope for this spec but listed under "Next Steps".

- **What happens when Vue SFC ESLint flags style violations the original generator never saw?** Same answer as type errors: fix the template (or the generator that emits it) and regenerate. The spec accepts that landing this PR will require fixes to several templates before CI is green.

- **What happens when `vue-tsc` has a different TypeScript version than the root?** `vue-tsc` ships with its own bundled TS. We use whatever it's pinned at; root TypeScript stays at `^6.0.3`. Risk: if `vue-tsc`'s TS is older and rejects newer syntax, we adjust template syntax to the lower bound. Verify in Phase 1.

## Dependencies

- [x] PR #121 merged (templates are real source files, not `.hbs`).
- [ ] F-068 (Vue boolean-prop filter) — surfaces as a runtime DOM bug, not a typecheck bug, but its fix changes the same Vue Button.vue this PR will typecheck. **Order:** PR #122 (this) opens first with red typecheck on the React 19 issue. F-068 fix can land in parallel or be folded in. Both must be green before merging this PR.
- [ ] React 19 JSX-types issue from `feedback-react-jsx-types` memory — likely surfaces as the `RefObject<HTMLElement & ...>` errors I saw in the kigumi-react starter build during PR #121 review. Must be fixed before CI is green.
- [ ] Possibly more — the only honest answer is "we'll see what `tsc` says." Phase 1 of the plan is dedicated to enumerating findings.

## Breaking Changes

None at the consumer level. Generated component output (the `.tsx` / `.vue` / `.component.ts` that ends up in user projects) is unchanged. This PR only adds dev-time guarantees.

For contributors: the `pnpm type-check` script now also runs `typecheck:templates`. If a contributor was relying on `pnpm type-check` to be fast (current ~3s on `src/` only), they'll see ~15-30s. Provide an escape hatch: `tsc --noEmit` directly is still the single-file equivalent.

## Acceptance Criteria

- [ ] `pnpm typecheck:templates` exits 0 against the current templates (after fixing surfaced bugs).
- [ ] `pnpm lint` covers `templates/vue/**/*.vue` and exits 0.
- [ ] CI Quality Checks job runs the new step on every PR.
- [ ] Removing the new ignore line for `templates/vue/**/*.vue` does NOT introduce false positives (verified by spot-checking generated diffs in 2-3 representative components).
- [ ] All existing tests pass (`pnpm test`, `pnpm test:integration`).
- [ ] Byte-identity of generated component output is preserved — fixes for surfaced bugs may change template files, but the **generator scripts** (`scripts/generate-<framework>-templates.ts`) emit consistent output before/after the fix.
- [ ] `pnpm validate:templates`, `pnpm validate:registry`, `pnpm validate:changes`, `pnpm validate:parity` pass.
- [ ] PR body documents which template bugs the PR fixed and why (so reviewers can verify in-scope vs. drive-by changes).
- [ ] `node_modules` size delta documented in PR body (rough number from `du -sh node_modules` before/after).
- [ ] Update `templates/AGENTS.md` with the new typecheck story so future contributors know what runs and how to debug.

## Open Questions

- ❓ **Should F-068 land inside this PR or as a parallel PR?** F-068 is a runtime DOM bug (Vue boolean-prop filter), not a typecheck bug. Bundling it here makes the PR description bigger but lets us ship one user-visible improvement (Sign In button works). Splitting it keeps PR #122 focused on the infra change. Default: split, fold in only if F-068's fix is trivial.
- ❓ **Project references vs. independent tsconfigs?** I'm leaning independent (separate scripts per framework) because vue-tsc isn't fully composable with `tsc -b` and the speed gain of references is marginal at this size. Open to feedback if someone has hit pain with this before.
- ❓ **Should Vitest `globals: true` be configured?** The tests in templates use `import { describe, it, expect } from 'vitest'` — they're not relying on globals. Probably no. Confirm during Phase 1.
- ❓ **`@awesome.me/webawesome` Free vs. Pro version pin.** Templates target both tiers. The free package types should be a superset compatible enough for typecheck. If they're not (e.g. Pro components have prop types that aren't in free), we hit "What happens when..." case 2 above. Best to install the latest free version (~3.5) and see.
- ❓ **Should we add the typecheck to the local `.claude/hooks/stop-quality-check.sh`?** Probably yes, but as a follow-up — keeping this PR focused on CI integration. Tracked in Next Steps.
