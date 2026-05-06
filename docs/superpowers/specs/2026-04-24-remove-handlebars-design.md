# Remove Handlebars from Kigumi CLI Templates

**Status:** Design approved 2026-04-24 — implementation in progress.
**Branch:** `feat/remove-handlebars` (worktree at `.claude/worktrees/feat-remove-handlebars`).

> **Update 2026-05-06 (PR #170):** F-042 removed `dist/templates/` entirely; templates now ship only at the package root via `files: ["templates", ...]`. The "Acceptance Criteria" check that references `dist/templates/**` no longer applies. Verify against the root `templates/` directory instead.

## Problem

Kigumi CLI ships 740 Handlebars templates across React, Vue, and Angular. The templating surface is tiny:

- **Four tokens only:** `{{name}}`, `{{tagName}}`, `{{description}}`, `{{{importPath}}}`. No conditionals, no loops, no helpers.
- **Only `importPath` varies at render time.** The other three tokens already match the folder name and registry value — they are constants per component.
- `importPath` itself only varies between `@awesome.me/webawesome` and `@awesome.me/webawesome-pro` (tier swap).

CSS templates already migrated off `.hbs` (F-026/F-027/F-031, commit `d5dcc36`). Precedent exists.

The cost of keeping Handlebars is invisibility: `eslint.config.js` ignores `templates/**` and `tsconfig.json` includes only `src/**`. `scripts/validate-templates.ts` runs `Handlebars.precompile()`, which only checks brace balance — it does not check whether the rendered TypeScript compiles, whether imports resolve, or whether React/Vue/Angular types line up.

PR #71 (Angular rollout) shipped type-level bugs that `validate:templates` missed because there is no compile gate for templates. Every template ships unverified.

## Goal

Templates become real `.tsx` / `.jsx` / `.vue` / `.component.ts` / `.test.*` files. `tsc` and `eslint` see them during normal CI. `handlebars` comes out of `dependencies`.

**User-facing CLI output is byte-identical.** The same four substitutions still happen; only they move from Handlebars to `String.replaceAll`.

## Non-goals

- Replacing the per-framework generator scripts with a different scaffold approach. They keep their current shape; only their output paths and embedded literals change.
- Upgrading `tests/integration/compile-check.test.ts` to `strict: true`, adding `vue-tsc`, or extending it to Angular.
- Rendering-then-validating every component × tier in CI as an ongoing check. The byte-identity guard is a one-time pre-merge verification, not a CI step.
- Any change to the Next.js `'use client'` post-render or Pages Router CSS-strip logic. Those code paths run after materialization and are unaffected.

## Design

### Detemplation strategy: one-off script

`scripts/detemplate.ts` is a single-use migration tool that walks `templates/**/*.hbs`, resolves the four known tokens per component via `getAllComponents()`, and rewrites each file to the non-`.hbs` path. The script lands in the PR for reviewability; a follow-up PR deletes it once the migration ships.

We do not reuse the per-framework `scripts/generate-{react,vue,angular}-templates.ts` generators here. A dedicated substitution tool is provably byte-identical to what `renderTemplate` produces today for a free-tier consumer, which is what the byte-identity guard requires.

### Tier substitution after detemplation

Post-detemplation, every file contains `@awesome.me/webawesome/dist/components/{slug}/{slug}.js` as a literal string. The Pro-tier swap must hit **all** occurrences in the file, not just one anchored at `^`:

- React/Vue templates: one `importPath` reference per file.
- Angular templates: two references per file (one `import type`, one dynamic `import()`).

The existing tier regex in `src/utils/template.ts:216-219` is anchored (`/^@awesome\.me\/.../`) and uses `.replace()` — correct for substituting a single-field `importPath` value, wrong for in-file content.

The replacement regex is non-anchored, global, and uses a negative lookahead:

```ts
text.replaceAll(/@awesome\.me\/webawesome(?!-pro)/g, packageName);
```

The lookahead prevents `webawesome-pro` from being matched and re-doubled. Every `LOCAL_REGISTRY` entry uses the free package as base (`tests/unit/tier-consistency.test.ts:125-140` already guards this), so the regex only ever rewrites `webawesome` → `webawesome-pro`, never the reverse.

### Generator scripts

`scripts/generate-{react,vue,angular}-templates.ts` are author-run, not in `pnpm build` or CI. They currently emit `.hbs` with `'{{{importPath}}}'` string literals (Angular additionally emits `{{name}}` / `{{tagName}}` / `{{description}}`). This PR updates them so future regenerations produce drop-in, token-free files: output extensions lose `.hbs`; the embedded `'{{{importPath}}}'` becomes a `'${component.importPath}'` template interpolation; the Angular generator substitutes the other three tokens in the same way.

### Validation

`scripts/validate-templates.ts` loses its Handlebars dependency. The brace-balance check is replaced with `validateNoTokens()`, which asserts that no template file matches `/\{\{[^}]+\}\}/`. This is the regression guard that prevents anyone from re-introducing a Handlebars token.

### Type and lint coverage

Each framework gets a dedicated `templates/{fw}/tsconfig.json` (`composite: true`, `noEmit: true`) referenced from the root `tsconfig.json`. Templates now type-check during `pnpm type-check`.

`eslint.config.js` removes `templates/**` from its `ignores` array and adds three scoped config blocks (one per framework).

## Files touched

- **Core:** `src/utils/template.ts` (most of the churn), `scripts/validate-templates.ts`, `scripts/generate-{react,vue,angular}-templates.ts`, `scripts/detemplate.ts` (new).
- **Config:** `tsconfig.json`, `templates/{react,vue,angular}/tsconfig.json` (new), `eslint.config.js`, `package.json`.
- **Tests:** `tests/unit/template.test.ts`, `tests/unit/tier-consistency.test.ts`, `tests/unit/angular-templates.test.ts`, `tests/unit/next-support.test.ts`, `tests/unit/no-handlebars-tokens.test.ts` (new).
- **Docs:** `AGENTS.md`, `CLAUDE.md`, `src/AGENTS.md`, `templates/AGENTS.md`, `tests/AGENTS.md`, plus the `.claude/skills/{generate-component-wrapper,kigumi-react,kigumi-feature-spec}/` skills.

## Verification

The byte-identity guard is the load-bearing check: before the PR, `generateComponent` / `generateComponentTestContent` / `generateComponentCSSContent` are called for every component × framework × tier × typescript variant on `main`, archived to `/tmp/kigumi-baseline-main`. After the refactor, the same capture runs against the branch and `diff -r` must be empty.

Standard CI (`pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm validate:templates`) must pass with the expanded template coverage.

`pnpm pack --dry-run` must show `dist/templates/**` without any `.hbs` file and no bundled `handlebars` runtime.

## Rollback

Single-PR squash-merge. Revert is a `git revert` of the merge commit; no persistent state, no data migration, `handlebars` returns to `package.json`, `.hbs` files reappear.
