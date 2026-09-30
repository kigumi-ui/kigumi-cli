# Kigumi CLI - AI Agent Guide

> **shadcn/ui for Web Awesome** - Template-based CLI for React/Vue/Angular/Next.js wrappers around Web Awesome components.

**Version**: 1.2.0 | **Stack**: TypeScript, Commander, Zod

## Quick Start

```bash
pnpm build              # Build CLI + copy templates
pnpm test               # Run unit tests
pnpm lint && pnpm type-check  # Verify code quality
```

**Test the CLI:**

```bash
node dist/index.js init --framework=react --theme=awesome --yes
node dist/index.js add button --force
```

## Repository Structure

| Directory | Purpose | Local AGENTS.md |
| --- | --- | --- |
| `src/` | CLI source code | [src/AGENTS.md](src/AGENTS.md) |
| `templates/` | Component templates (real `.tsx`/`.vue`/`.component.ts` files) | [templates/AGENTS.md](templates/AGENTS.md) |
| `tests/` | Unit & E2E tests | [tests/AGENTS.md](tests/AGENTS.md) |
| `tools/` | Local dev tooling (ESLint plugin); not published | - |
| `.claude/skills/` | AI agent skills | - |
| `dist/` | Build output | - |

**Key Files:**

| File | Purpose |
| --- | --- |
| `src/index.ts` | CLI entry point (Commander routing) |
| `src/utils/registry.ts` | Component definitions (single source of truth) |
| `src/utils/tier.ts` | Free/Pro tier detection: `package.json`, then a token (environment variable, user npmrc, `.env`) |
| `src/utils/npmrc.ts` | Where npm and pnpm find the Pro token (user npmrc path, npm's auth-key walk, `${VAR}` expansion) and Kigumi's lines in the project `.npmrc`: `writeProjectNpmrc()` merges them and decides the `${WEBAWESOME_NPM_TOKEN}` reference, issue #160 |
| `src/utils/registry-resolver.ts` | Resolves `--from` value (URL or saved registry name) |
| `src/commands/init/` | Project initialization |
| `src/commands/add/` | Component installation (built-in + community) |
| `src/commands/registry.ts` | Community registry management (connect, list, remove) |
| `src/commands/theme/install.ts` | Community theme installation from registry |
| `src/commands/theme/list.ts` | List available themes for current tier |
| `src/commands/theme/show.ts` | Show current theme details |
| `src/commands/list.ts` | List all available components (`--json` supported) |
| `src/commands/status.ts` | Project status (`--json` supported) |
| `src/commands/upgrade.ts` | Version upgrade + dependency installation |
| `src/commands/diff.ts` | Compare installed components vs current templates |
| `src/commands/update.ts` | Three-way merge update for installed components |
| `src/utils/diff-renderer.ts` | Colored unified diff output using node-diff3 diffPatch |
| `src/utils/snapshot.ts` | Snapshot CRUD for `.kigumi/snapshots/` |
| `src/utils/three-way-merge.ts` | Three-way merge logic using `node-diff3` |
| `src/utils/version-check.ts` | CLI vs project version compatibility check |
| `src/utils/version-map.ts` | Version history + breaking changes data |
| `src/utils/github-fetcher.ts` | GitHub registry fetcher (also handles local filesystem `RegistrySource` since 0.20.0) |
| `src/utils/foreign-files-staging.ts` | Stages source-framework files into `.kigumi/foreign/<slug>/` for `--cross-framework` |
| `src/schemas/community-registry.ts` | Community registry schema validation |
| `scripts/parse-custom-elements.ts` | Parse WA custom-elements.json → `component-metadata.ts` / `css-metadata.ts` (data only). Types live in `src/utils/metadata-types.ts` and are imported + re-exported by the generated modules (issue #34) |
| `scripts/event-types.ts` | Resolve each manifest event to the type its handler receives: the Web Awesome class the component dispatches, read from `dist/events/*.d.ts` via the event name it registers, else a native event's declared scalar type or `NATIVE_EVENT_TYPES`. `EVENT_CLASS_OVERRIDES` pins the accordion's classes; `MANIFEST_EVENT_ARTIFACTS` pins manifest events that never fire, which `resolveEvents()` drops; stale entries are judged against what the manifest describes. Anything unresolvable stops the parser. See `docs/adr/0005` |
| `scripts/find-cem.ts` | Resolve the Web Awesome CEM on disk, scoped to one root: `resolveCem()` returns path + tier (pro/free) + component count; `{ tier: 'free' }` narrows it to the Free package. Shared by the parser, the skill-reference generator and the freshness guard |
| `scripts/check-metadata-freshness.ts` | Prebuild gate: exits 1 when `component-metadata.ts` is missing or older than the CEM or any `dist/events/*.d.ts` beside it, triggering regen |
| `scripts/guard-outcome.ts` | Shared reporting vocabulary for CEM-dependent guards: `summarizeGuard()` keeps "did it pass" and "did it actually run" as separate facts; `skipPermitted()` decides where an absent manifest may be tolerated. Consumed by `check-generated-fresh.ts`, `validate-cem-sync.ts` and the Pro consumer tsc (`tests/e2e/_helpers/consumer-premise.ts`), which reports did-not-run where the pinned Pro package cannot be installed. Every skipped headline carries `NOT_VERIFIED`. See `docs/adr/0003` |
| `scripts/is-entry-point.ts` | `isEntryPoint(import.meta.url)`: true only when the script is the process entry point. Compares real paths, so an absolute invocation through a symlinked directory still runs `main()` instead of exiting 0 silently. Used by the parser, the React/Angular generators (issue #106) and the skill-reference generator (issue #129) |
| `scripts/check-commit-attribution.ts` | `commit-msg` hook: rejects AI attribution trailers (`Co-Authored-By: Claude`/`Cursor`, `Generated/Made/Created with ...`). Prose mentioning Claude is deliberately allowed. `--pr` mode (`validate:attribution`, CI `attribution` job) checks every branch commit, since squash merges copy them onto main server-side (issue #97); the PR body is `validate:pr-body`'s job |
| `scripts/pr-body-rules.ts` | Pure rules for PR bodies and PR logs (issue #150, `docs/adr/0006`): `checkBody()` (four allowed headings, no tables/`<details>`/HTML comments/checklists, 2,500 characters, attribution, and on a ready PR claims matched against the diff), `checkRewrite()`/`checkEditHistory()`/`bodyEdit()` (a rewrite of a ready PR, also from GitHub's edit history, and the machine-written trail), `logCoverage()`/`logStatus()` (`**Round N** · Covers: a..b` ranges), `isExempt()` |
| `scripts/pr-body-context.ts` | The git facts those rules check against: highest changeset bump in the diff, known paths, branch commits with committer time, `rev-list` range resolver, and `prMergeBase()` (fetches the PR's head and base from `origin` under `refs/pr-log/`, returns their merge base, removes the refs again) |
| `scripts/pr-github.ts` | Thin `gh api` calls for the PR guards (issue lookup where only a 404 means missing, PR comments, the body's edit history, when the PR last became ready, comment and commit-status posting) |
| `scripts/validate-pr-body.ts` | `validate:pr-body`: runs the body rules in `pr-body.yml` from the event payload (`--event`, `--trail` posts the edit diff), or locally on a body file (`--body-file [--draft] [--pr N]`) |
| `scripts/check-pr-log.ts` | `check:pr-log`: sets the `pr-log` commit status in `pr-log.yml` (`--post-status`); fetches the PR's commits and only reads them, so it is safe on comment-triggered runs |
| `scripts/check-external-links.ts` | `check:external-links`, weekly `maintenance.yml`: requests every external URL in README.md and NOTICE and reports the dead ones. Always exits 0; `validate:doc-links` covers relative links |
| `scripts/check-generated-fresh.ts` | `validate:generated-fresh` drift guard. B: docs-wrapper CSS rules (comment-normalized) match templates; C: `.jsx`/`.js.vue` stay within `.tsx`/`.vue`; D: starter-fixture CSS rules match templates. A (regenerate metadata/templates/skill-refs/Pro typecheck shim in a tmp copy + diff; the copy's generator output is cleared first and the Template trees are compared both ways, so a committed Template no generator writes is drift as much as one that differs, issue #80) requires a CEM covering every registry component; a partial one is refused and an unverified run is never reported as a pass (issue #43). Runs in CI's own `freshness` job |
| `scripts/check-mock-budget.ts` | `check:mocks`: counts `vi.mock` occurrences in `tests/unit/` against a total budget (50) and a per-file budget. Enforced in CI via `MOCK_BUDGET_ENFORCE=1`; advisory locally |
| `scripts/generate-angular-templates.ts` | Generate Angular component templates from registry + metadata |
| `scripts/generate-react-templates.ts` | Generate React component templates from registry + metadata |
| `scripts/generate-vue-templates.ts` | Generate Vue SFC templates from registry + metadata |
| `scripts/generator-utils.ts` | Shared helpers (`DOM_GLOBALS`, `extractCustomTypeImports`, `formatEventTypeImports`, `handlerArgument`, `generateCssTemplate`, rule-11 keyword emitters, `propJsdocLines`) used by all three generators. `generateCssTemplate(name, { selector, body })` emits every component CSS template: the header comment is identical across frameworks, and only the selector block differs (Angular `:host { display: contents }`, React/Vue `.ComponentName`), see issue #30 |
| `scripts/sync-wa-pro-shim.ts` | `generate:pro-shim`: write `typecheck-shims/wa-pro-{paths,jsx}.d.ts` from the Pro package the docs site installs (names, types and signatures only, no Pro prose). Run after `generate:metadata` on every bump; Check A fails on a stale shim (issue #108) |
| `scripts/generate-skill-references.ts` | Generate React/Vue/Angular API surface files for skills (deprecated props labelled) |
| `scripts/publish-skills.mjs` | Copy whitelisted skills to docs/public/ for Vercel (whitelist lives here) |
| `scripts/generate-skills-index.mjs` | Generate `.well-known/skills/index.json` from published skills |
| `scripts/vercel-ignore-build.mjs` | Vercel `ignoreCommand` for both Vercel projects (`docs`, `storybook`): builds only when a file the project renders or serves changed since the branch's last deployment (docs/ denylist, plus CHANGELOG, `package.json`, `llms.txt` and the `PUBLISHED_SKILLS` for the landing page); dependabot branches never deploy. Plain Node, runs before install, builds whenever unsure |
| `scripts/post-changeset-version.ts` | Update version references after changeset version bump |
| `tools/eslint-plugin-kigumi/` | Local ESLint plugin (plain directory, imported by relative path from `eslint.config.js`, not an npm package, no workspace). Rules are `.js` so `pnpm lint` needs no build step. Tested via RuleTester in `tests/unit/eslint-rules/` |
| `scripts/setup-npmrc.mjs` | Write Pro token from `.env` to `~/.npmrc` and `docs/.npmrc` |
| `scripts/update-starter-snapshots.ts` | Bulk-regenerate `tests/fixtures/starter-snapshots/` from local starter clones (env-var driven; see script header) |
| `scripts/validate-agents.ts` | Validate AGENTS.md facts against codebase reality (7 checks: version, component counts, pro list, template dirs, test files (the `tests/AGENTS.md` tree has a row for every test file under `tests/` outside `fixtures/`, matched by exact path or a glob row in the same directory, and every row names a file that exists), prose count claims in `templates/AGENTS.md`, and no "Last Updated" stamp or changelog in any tracked AGENTS.md/CLAUDE.md) |
| `scripts/validate-cem-sync.ts` | `validate:cem-sync`. Two halves, reported separately: component presence (committed `COMPONENT_METADATA` vs. registry, always runs) and the manifest half (needs a complete CEM): prop-value drift (registry enums vs CEM attribute types), attribute-name drift (`checkAttributeDrift()`, #100), deprecation drift (`checkDeprecationDrift()`, `KIGUMI_DEPRECATIONS`, #133) and default drift (`checkDefaultDrift()`, #152). Only a run where both halves were verified prints a pass (#43, `docs/adr/0003`). The manifest half runs in CI's `freshness` job. |
| `scripts/validate-changes.ts` | No manual-edit markers in generated files, no known anti-patterns. Template file completeness is `validate:templates`' job |
| `scripts/validate-cache-keys.ts` | `validate:cache-keys`, CI: the Playwright browser cache key and path in `cache-warm.yml` (writer, on main) and `ci.yml` (reader, on PRs) must match. Drift is silent: CI passes but re-downloads the browsers every run |
| `scripts/validate-changesets.ts` | `validate:changesets`, CI: every changeset needs a Keep a Changelog category header (`### Added`, `### Fixed`, ...). `post-changeset-version.ts` drops content before the first header without a warning |
| `scripts/validate-doc-links.ts` | `validate:doc-links`, CI: every relative link in a tracked `.md`/`.mdx` file must resolve. Skips external URLs, bare anchors, fenced code and `tests/fixtures/` |
| `scripts/validate-flush-code.ts` | `validate:flush-code`, CI: a `pre` inside a zero-inset docs container (`--spacing: 0` card, `--padding: 0` tab panel) must carry the `flush-code` class, or Web Awesome's rounded corners leave a gap. Static per-file scan of `docs/src` |
| `scripts/validate-gha-permissions.ts` | Fail when a job running `actions/checkout` declares a job-level `permissions:` block without a readable `contents:`. Job-level blocks replace the workflow-level one rather than merging (the PR #173 regression) |
| `scripts/validate-no-secrets.ts` | `validate:no-secrets`, CI: fail on a tracked file holding a provider-prefixed credential (Chromatic `chpt_`, npm, GitHub, Slack, AWS, OpenAI, Anthropic, Stripe live keys), a tracked `.env` (`.env.example` is fine), or an absolute home-directory path. Prefix matching, not entropy; obvious placeholders pass. The Chromatic token lives in the `CHROMATIC_PROJECT_TOKEN` secret, never in `docs/package.json` |
| `scripts/validate-parity.ts` | Validate React/Vue/Angular template parity |
| `scripts/validate-registry.ts` | Validate registry definitions are complete |
| `scripts/validate-story-lanes.ts` | Check the shared interaction-lane story list against the stories actually tagged `interaction`, in both directions |
| `scripts/validate-fixture-exclusions.ts` | Check that `.prettierignore`, `eslint.config.js` and `tsconfig.tests.json` all exclude `tests/fixtures/starter-snapshots` (recorded CLI output that must not be reformatted) |
| `scripts/validate-templates.ts` | Every registry component's Template directory holds exactly `getTemplateFileNames()`, no per-Template test (issue #80); dotfiles such as `.DS_Store` are skipped. No Template holds a stray `{{...}}` token |
| `scripts/validate-wa-pins.ts` | Validate the six Web Awesome version pins agree, are exact, and that the newest VERSION_MAP entry matches `DEFAULT_WEBAWESOME_VERSION` |
| `scripts/check-starter-wa-version.ts` | Starter job step: fail when the starter's installed Web Awesome is older than `DEFAULT_WEBAWESOME_VERSION`; a starter without Web Awesome installed fails too (issue #138) |
| `scripts/check-tests-baseline.ts` | `check:tests`, part of `type-check`: runs `tsc -p tsconfig.tests.json` and fails on any error not in `tests/.tsc-baseline.json`; `--update-baseline` regenerates it |
| `scripts/check-upstream-versions.ts` | `check:upstream-versions`, weekly `maintenance.yml`: reports toolchain majors and the `SCAFFOLD_PINS` scaffolders newer than what the repo pins, minus the holds in `upstream-holds.json`. Not Web Awesome (that is `check:wa-upgrade`). Always exits 0 |
| `scripts/check-wa-upgrade.ts` | `check:wa-upgrade`, weekly `maintenance.yml`: diffs the latest published Web Awesome manifest against the pinned one (components added/removed, attributes removed or retyped) and lists the pin locations a bump touches. Reads the Free package, so no token. Always exits 0 |
| `scripts/verify-test-app.ts` | Verify test app output after build |
| `scripts/storybook/overrides.ts` | Storybook story overrides |
| `scripts/storybook/patch-stories.ts` | Patch generated Storybook stories |
| `scripts/storybook/story-data.ts` | Storybook story data helpers |
| `scripts/storybook/validate-stories.ts` | Validate Storybook story structure: an argType per registry prop, and each argType's `defaultValue.summary` equal to the registry default, read from the parsed story file; an argType whose summary it cannot read statically is an `unreadable-argtypes` error, never a skip (issue #152, `docs/adr/0003`) |
| `scripts/release-readiness.ts` | Run all pre-release gates + state-file meta-checks, persist a Go/No-Go report; powers `/release-readiness`. A gate that exits 0 but reports a guard `NOT verified` fails (`judgeGate()`, docs/adr/0003) |
| `scripts/upstream-holds.json` | Majors already evaluated and deliberately held: toolchain (`typescript`, `vitest`) and the `@angular/cli` scaffold pin (Angular 22, until #156); `check-upstream-versions.ts` reads it so the weekly report stops re-flagging a decision already made, and only surfaces a genuinely new major |

---

## Skills

| Skill | Location | Audience | Purpose |
| --- | --- | --- | --- |
| `kigumi-react` | `.claude/skills/kigumi-react/` | End user | Convert WA HTML to Kigumi React JSX |
| `kigumi-vue` | `.claude/skills/kigumi-vue/` | End user | Convert WA HTML to Kigumi Vue SFC |
| `kigumi-angular` | `.claude/skills/kigumi-angular/` | End user | Convert WA HTML to Kigumi Angular |
| `kigumi-cross-framework` | `.claude/skills/kigumi-cross-framework/` | End user | Convert components between React/Vue/Angular (paired with `kigumi add --cross-framework`) |
| `kigumi-compose-form` | `.claude/skills/kigumi-compose-form/` | End user | Build forms with validation |
| `kigumi-compose-layout` | `.claude/skills/kigumi-compose-layout/` | End user | Build page layouts, dashboards |
| `kigumi-compose-overlay` | `.claude/skills/kigumi-compose-overlay/` | End user | Build dialogs, drawers, menus, toasts |
| `kigumi-compose-data` | `.claude/skills/kigumi-compose-data/` | End user | Build data tables, stats, list views |
| `kigumi-theme` | `.claude/skills/kigumi-theme/` | End user | Theme customization guidance |
| `generate-theme-preset` | `.claude/skills/generate-theme-preset/` | Contributor | Create Studio theme presets |
| `generate-component-wrapper` | `.claude/skills/generate-component-wrapper/` | Contributor | Generate React/Vue wrapper templates |
| `release` | `.claude/skills/release/` | Contributor | Prepare and publish releases |
| `kigumi-feature-spec` | `.claude/skills/kigumi-feature-spec/` | Contributor | Create feature specs and plans |
| `apply-theme-to-figma` | `.claude/skills/apply-theme-to-figma/` | Contributor | Apply CSS tokens to Figma UI Kit |
| `pr-log` | `.claude/skills/pr-log/` | Contributor | Write the PR body and post one log comment per push |

### Skills Publishing

End-user skills are published to `kigumi.style/.well-known/skills/` via Vercel. The mechanism:

1. `scripts/publish-skills.mjs` copies whitelisted skills from `.claude/skills/` into `docs/public/skills/` and `docs/public/.well-known/skills/`
2. `scripts/generate-skills-index.mjs` generates `index.json` from the copied directories
3. Internal directories (`evals/`) are excluded from the published output -- only `SKILL.md` and `references/` ship to consumers
4. Vercel serves `.well-known/skills/*` with CORS headers for cross-origin skill discovery

**When adding a new end-user skill**, add it to the `PUBLISHED_SKILLS` array in `scripts/publish-skills.mjs`. `scripts/vercel-ignore-build.mjs` imports the same array, so changes to the new skill trigger a docs deployment without further wiring. Contributor-only skills (e.g. `release`, `generate-component-wrapper`) are intentionally excluded.

---

## Critical Rules

### 1. Templates-First Development

**NEVER edit generated code. ALWAYS update the templates under `templates/`.**

Templates are real framework source files (`.tsx`, `.jsx`, `.vue`, `.component.ts`, `.css`). They are validated by `tsc` and `eslint` like any other source file. The function harnesses in `tests/unit/` prove the TypeScript Templates against the CEM, and Check C holds each JavaScript variant to its TypeScript sibling; there is no per-Template test (issue #80). The CLI substitutes only one thing at runtime — the Free→Pro tier swap on the `@awesome.me/webawesome` import path; everything else is read verbatim.

```
Edit template → pnpm build → node dist/index.js add {component} --force → Test
```

- TypeScript: `.tsx` (with interfaces)
- JavaScript: `.jsx` (with JSDoc)
- See [templates/AGENTS.md](templates/AGENTS.md) for patterns

### 2. React Import Patterns

> **Why different?** TypeScript benefits from tree-shaking with named imports. JavaScript uses default import for broader compatibility with older bundlers.

**TypeScript (.tsx):** Use named imports

```typescript
import { forwardRef, useState, type HTMLAttributes } from 'react';
```

**JavaScript (.jsx):** Use default import + destructure

```javascript
import React from 'react';
const { useState } = React;
```

### 3. Web Components Use `class`, NOT `className`

```typescript
// Correct
<wa-button class={clsx('Button', className)}>

// Wrong - doesn't work
<wa-button className={className}>
```

### 4. TypeScript Declarations: Use `declare global`

**NEVER use `declare module 'react'`** - it overwrites React exports!

```typescript
// WRONG - breaks React
declare module 'react' {
  namespace JSX { ... }
}

// CORRECT - extends without breaking
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
export {};
```

### 5. Event Listeners in useEffect (with cleanup)

```typescript
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  el.addEventListener('wa-show', handleShow);
  return () => el.removeEventListener('wa-show', handleShow);
}, [onShow]);
```

### 6. Web Component Registration

Generated wrappers register their WA component via a mount-triggered dynamic `import()` inside the wrapper itself, not through a central barrel. Each component becomes its own async chunk, so unused components are tree-shaken out of route bundles. For LCP-critical components that must ship in the initial chunk, add an explicit eager import in `src/lib/kigumi.ts`:

```typescript
import '@awesome.me/webawesome/dist/components/button/button.js';
```

### 7. Dialog API: `requestClose()` not `hide()`

```typescript
hide: () => dialogRef.current?.requestClose(),
requestClose: () => dialogRef.current?.requestClose(),
```

### 8. Angular: `CUSTOM_ELEMENTS_SCHEMA`

Always include in `schemas` array for standalone components that use `wa-*` elements:

```typescript
@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
```

### 9. Angular: `k-` Selector Prefix

All Kigumi Angular components use `k-` prefix (e.g., `<k-button>`, `<k-dialog>`).

### 10. Angular: Event Collision Suffixes

An `@Output()` shares the component class namespace with its public methods and `@Input()`s, so a name already taken there gets an `Event` suffix. `input` always does, since it reads as the `@Input()` decorator. The rule is `toAngularOutputName()` in `src/utils/naming.ts`, shared by the generator and the Angular function harness:

| WA Event | Angular @Output() | Why |
| --- | --- | --- |
| `input` | `inputEvent` | always |
| `blur` | `blurEvent` | form controls have a public `blur()` method |
| `focus` | `focusEvent` | form controls have a public `focus()` method |
| `wa-show` | `showEvent` | only with a public `show()` (e.g. Tooltip, Select) |
| `wa-invalid` | `invalidEvent` | only with an `invalid` input (e.g. Select, RadioGroup) |

Non-colliding events keep their base name: `wa-hide` -> `hide`, `wa-after-show` -> `afterShow`, and Dialog's `wa-show` -> `show` (its `show()` is private since WA 3.5.0).

### 11. Angular: CVA for Form Controls

Form controls implement `ControlValueAccessor`. Use `[(ngModel)]` or `[formControl]`, never manual event wiring for value tracking.

### 12. Next.js Is a React Variant

Next.js projects — **App Router and Pages Router, both with or without a `src/` layout** — use the existing React plugin and React templates. `config.framework` stays `'react'`. The Next-specific behavior branches on three runtime detectors in `src/utils/detect-framework.ts`:

- `isNextProject(cwd)` — `true` when `next` is a dep or a `next.config.*` file exists.
- `detectNextRouter(cwd)` — `'app' | 'pages' | 'unknown'`; App Router wins when both dirs coexist.
- `detectSourceLayout(cwd)` — `'src' | 'root'`; drives Kigumi's directory defaults and the `@/*` tsconfig alias target so `create-next-app` with or without `--src-dir` both work without rewriting user config.

What this enables:

- Every generated React wrapper starts with `'use client';`. App Router needs it; Pages Router treats it as a harmless string, so emitting it uniformly means a project can migrate routers without regenerating wrappers.
- `src/lib/kigumi.ts` (or `lib/kigumi.ts` in root layout) also starts with `'use client';` — the `customElements.define` side-effect needs the browser.
- Every wrapper's `<wa-*>` host element carries `suppressHydrationWarning`. Lit reflects default attributes to the DOM during `connectedCallback`; `suppressHydrationWarning` is the documented React API for that pattern (one-level, children still reconcile) and a no-op in non-SSR contexts.
- `init` skips `vite.config.ts` path-aliasing, picks `tsconfig.json` when `tsconfig.app.json` is absent, emits a sibling `web-awesome.d.ts` (no `vite/client` reference) instead of `vite-env.d.ts`, and — **only for App Router** — writes `providers.tsx` with a `KigumiProvider` Client Module next to `app/`.
- **Pages Router projects are not scaffolded** with a new file; the user's `pages/_app.tsx` is their own. Post-install output prints three imports (`layers.css`, `theme.css`, `@/lib/kigumi`) + the `AppProps` wrapper to add manually.
- **Pages Router CSS policy**: Next forbids global CSS imports anywhere other than `pages/_app.tsx`. Kigumi handles this at generation time by (a) omitting the `layers.css` import from the generated `lib/kigumi.ts` and (b) stripping the per-component `import './<Name>.css';` line from each generated wrapper. Both are unconditional when `detectNextRouter(cwd) === 'pages'`, and unchanged for App Router. Per-component stub CSS files are still emitted so users can add imports to `_app.tsx` if they want custom styles.
- `generateGitIgnore` adds `.kigumi/cache/` in addition to `.kigumi/foreign/`. `.kigumi/snapshots/` stays tracked (three-way merge depends on it); `.npmrc` stays committable: it holds no secret, only the registry URL and, on Pro, a `${WEBAWESOME_NPM_TOKEN}` reference unless the user npmrc holds the token.

Do not add a `'next'` entry to the `framework` enum — duplicating templates under `templates/nextjs/` would force parallel maintenance of 89 components for no gain.

---

## CSS Utilities

Prefer Web Awesome utility classes over custom CSS for layout and style composition:

**Layout utilities** (`.wa-` prefix — applied via `className` on plain HTML elements):

| Class         | Purpose                                 |
| ------------- | --------------------------------------- |
| `.wa-stack`   | Vertical stacking with consistent gap   |
| `.wa-grid`    | Responsive column grid                  |
| `.wa-cluster` | Horizontal wrapping group (tags, chips) |
| `.wa-flank`   | Sidebar + main content split            |
| `.wa-frame`   | Aspect-ratio constrained container      |
| `.wa-split`   | Two equal columns                       |

**Style utilities:**

| Class      | Purpose                                |
| ---------- | -------------------------------------- |
| `.wa-dark` | Applies dark color scheme to a subtree |

Reference: https://webawesome.com/docs/utilities/ and https://webawesome.com/docs/layout/

---

## Tier System

**Single source of truth:** `package.json` determines tier (with token fallback), NOT config.

| Tier | Detection | Package | Themes |
| --- | --- | --- | --- |
| Free | `@awesome.me/webawesome` in package.json | `@awesome.me/webawesome` | 3 themes |
| Pro | `@awesome.me/webawesome-pro` in package.json | `@awesome.me/webawesome-pro` | 11 themes |

**Pro-only components:** chart, bar-chart, line-chart, bubble-chart, doughnut-chart, pie-chart, polar-area-chart, radar-chart, scatter-chart, combobox, file-input, number-input, sparkline, toast, toast-item, video, video-playlist, date-picker, date-input

### Tier Detection Logic

```typescript
// src/utils/tier.ts - Detects tier with package.json priority
async function detectTier(cwd: string): Promise<Tier> {
  // 1. Check package.json first (installed package is source of truth)
  const pkg = await fs.readJSON('package.json');
  if (pkg.dependencies?.['@awesome.me/webawesome-pro']) return 'pro';
  if (pkg.dependencies?.['@awesome.me/webawesome']) return 'free';

  // 2. Fallback to token detection (env var, user npmrc, .env)
  const token = await detectProToken(cwd);
  return token ? 'pro' : 'free';
}
```

**Detection priority:**

1. `package.json` dependencies (highest priority - actual installed package)
2. Environment variable `$WEBAWESOME_NPM_TOKEN` (CI/CD)
3. User npmrc token: `~/.npmrc`, or the file `npm_config_userconfig` / `NPM_CONFIG_USERCONFIG` names (the `//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken` key)
4. Project `.env` file (`WEBAWESOME_NPM_TOKEN`)
5. Default to `free` if none found

Finding a token only selects the Pro tier. npm and pnpm read the token from an npmrc, never from `.env`, so installs authenticate through the project `.npmrc` (see `src/AGENTS.md` "Pro Authentication").

**Token Setup (Architecture):**

The repository includes `scripts/setup-npmrc.mjs` which reads tokens from `.env` files and writes them to:

- Global `~/.npmrc` (for npm/yarn)
- `docs/.npmrc` (gitignored) - the Pro registry line `docs/` needs, plus the token; CI's docs jobs write only this file

```bash
# Setup token (after clone, or when .env changes)
pnpm run setup:npmrc
```

This approach:

- Works with npm, pnpm, AND yarn
- Supports different tokens per machine (reads from `docs/.env` or root `.env`)
- `docs/.npmrc` is gitignored and generated from `.env` (token never committed)

**docs/ vs. User Projects:**

| Context | `.npmrc` location | Token source |
| --- | --- | --- |
| User project | Project root | No secret: registry URL, plus a `${WEBAWESOME_NPM_TOKEN}` reference on Pro; the token is the environment variable or the user npmrc, never `.env` |
| docs/ (this repo) | `docs/.npmrc` | Gitignored; generated by `setup:npmrc` from `.env` |

`kigumi init` writes a user project's `.npmrc` through `writeProjectNpmrc()` (`src/utils/npmrc.ts`): the registry line, plus on Pro a `${WEBAWESOME_NPM_TOKEN}` reference unless the user npmrc already holds the token. The file holds no secret. The docs app has no committed `.npmrc`, so `docs/.npmrc` carries its Pro registry line and the token. pnpm reads the user npmrc auth line like npm does (checked with pnpm 10: a fresh Pro install succeeds with only that line and gets a 401 without it).

### Migration Triggers

| Previous | New  | Action                                     |
| -------- | ---- | ------------------------------------------ |
| free     | pro  | Migrate imports to `-pro`, update `.npmrc` |
| pro      | free | Reverse migrate imports, update `.npmrc`   |

**Critical files:** `src/commands/init/migration.ts`, `src/utils/dependency-installer.ts`

---

## Code Quality (Zero Tolerance)

Pre-commit hooks enforce all checks. **All must pass before commit:**

```bash
pnpm lint          # ESLint: 0 problems
pnpm type-check    # TypeScript: 0 errors
pnpm format:check  # Prettier: all formatted
pnpm test          # Vitest: all passing
```

**Auto-fix:** `pnpm lint:fix && pnpm format`

---

## Architecture

### Module Boundaries

| Layer | Directory | Responsibility |
| --- | --- | --- |
| Entry | `src/index.ts` | CLI routing, error handling |
| Commands | `src/commands/` | User-facing operations |
| Utils | `src/utils/` | Business logic (registry, tier, config) |
| Schemas | `src/schemas/` | Zod validation |
| Errors | `src/errors/` | Typed error classes |
| Output | `src/output/` | Console formatting (delegates to prompts wrapper) |
| Prompts | `src/prompts/` | `@clack/prompts` wrapper + DI hook (`setPromptsForTesting`) |

### Module Dependency Graph

```mermaid
flowchart TD
    subgraph Entry["CLI Entry"]
        CLI["src/index.ts\nCommander routing"]
    end

    subgraph Commands["commands/"]
        init["init/\nconfig-builder, file-generator\nmigration"]
        add["add/\ncomponent-selector, validator\ninstaller, remote-installer"]
        theme["theme/\nset, install"]
        doctor["doctor.ts"]
        brand["brand.ts"]
        palette["palette.ts"]
        list["list.ts"]
        status["status.ts"]
        registry_cmd["registry/\ninit, validate, connect\nlist, remove"]
        upgrade["upgrade.ts"]
        diff["diff.ts"]
        update["update.ts"]
    end

    subgraph Utils["utils/"]
        registry["registry.ts\n89 ComponentDefinitions\nprops, deps, files, importPath"]
        template["template.ts\nmaterializeTemplate (read + tier swap)"]
        tier["tier.ts\nFree/Pro detection\ndetectTier"]
        config["config.ts\ncosmiconfig loader\nloadConfig, saveConfig, getConfig"]
        detect_fw["detect-framework.ts\ngetProjectInfo"]
        regenerate["regenerate.ts"]
        snapshot["snapshot.ts\n.kigumi/snapshots/ CRUD"]
        merge["three-way-merge.ts\nnode-diff3 merge logic"]
        github_fetcher["github-fetcher.ts\nURL parsing, raw fetch"]
        github_token["github-token.ts\nPAT resolution"]
        registry_cache["registry-cache.ts\nDisk cache with TTL"]
        registry_resolver["registry-resolver.ts\nresolveRegistrySource()"]
        version_check["version-check.ts\ncheckVersionCompatibility()"]
        version_map["version-map.ts\nVERSION_MAP, breaking changes"]
    end

    subgraph Schemas["schemas/"]
        schema_config["config.ts — Zod KigumiConfig"]
        schema_options["options.ts — Zod command options"]
        schema_tier["tier.ts — Zod tier types"]
        schema_community["community-registry.ts\nZod registry schema"]
    end

    subgraph Errors["errors/"]
        err_base["base.ts — KigumiError"]
        err_config["config.ts"]
        err_net["network.ts"]
        err_community["community-registry.ts"]
        err_version["version.ts\nVersionMismatchError"]
    end

    subgraph Checks["checks/"]
        check_runner["runner.ts — CheckRunner"]
        check_config["config-checks.ts"]
    end

    subgraph Templates["templates/"]
        tpl_react["react/ — 89 components\n.tsx, .jsx, .css"]
        tpl_vue["vue/ — 89 components\n.vue, .js.vue, .css"]
        tpl_angular["angular/ — 89 components\n.component.ts, .component.css"]
    end

    CLI --> Commands
    init --> config
    init --> tier
    init --> template
    init --> detect_fw
    add --> registry
    add --> tier
    add --> template
    add --> check_runner
    add --> github_fetcher
    add --> schema_community
    add --> registry_resolver
    theme --> config
    theme --> registry_resolver
    registry_cmd --> config
    registry_cmd --> github_fetcher
    doctor --> config
    doctor --> tier
    doctor --> constants
    upgrade --> config
    upgrade --> version_map
    diff --> config
    diff --> template
    diff --> registry
    diff --> snapshot
    update --> config
    update --> template
    update --> registry
    update --> snapshot
    update --> merge
    add --> snapshot
    add --> version_check

    template --> tpl_react & tpl_vue & tpl_angular
    template --> registry
    template --> css_meta

    github_fetcher --> github_token
    github_fetcher --> registry_cache

    config --> schema_config
    add --> schema_options
    tier --> schema_tier
    check_runner --> check_config & check_deps
    Commands --> Errors
```

### Command Flows

```mermaid
sequenceDiagram
    participant User
    participant CLI as index.ts
    participant Checks as checks/runner
    participant Config as utils/config
    participant Tier as utils/tier
    participant Reg as utils/registry
    participant Tpl as utils/template
    participant FS as File System

    Note over User,FS: === kigumi init ===
    User->>CLI: kigumi init [options]
    CLI->>Checks: PackageJsonExistsCheck
    Checks-->>CLI: pass/fail
    CLI->>CLI: detectFramework(cwd) via utils/detect-framework
    CLI->>Tier: detectTier(cwd) — reads .env + package.json
    Tier-->>CLI: free | pro
    CLI->>Config: buildConfig (framework + tier + theme + palette)
    CLI->>Config: saveConfig → kigumi.config.json
    CLI->>Tpl: generateProjectFiles (kigumi.ts, layers.css, theme.css)
    Tpl->>FS: write setup files
    CLI->>FS: execa(pnpm/npm/yarn install)
    CLI-->>User: Success + next steps

    Note over User,FS: === kigumi add button ===
    User->>CLI: kigumi add button [--force]
    CLI->>Checks: ConfigExistsCheck
    Checks-->>CLI: pass/fail
    CLI->>Config: loadConfig(cwd) → KigumiConfig
    CLI->>Tier: detectTier(cwd)
    Tier-->>CLI: free | pro
    CLI->>Reg: getComponent("button") → ComponentDefinition
    Reg-->>CLI: { name, tagName, props, dependencies, files, importPath, tier }
    CLI->>Tpl: materializeTemplate(template path, packageName)
    Tpl->>FS: read template file from templates/{framework}/{Component}/
    Tpl->>Tpl: replaceAll free-package → pro-package (if Pro tier)
    Tpl-->>CLI: GeneratedFile[]
    CLI->>FS: write .tsx/.vue + .css
    CLI->>Tpl: updateComponentIndex (barrel export)
    CLI-->>User: Added 1 component(s)

    Note over User,FS: === kigumi add --from <name> ===
    User->>CLI: kigumi add comp --from mischa-dev
    CLI->>Checks: ConfigExistsCheck
    Checks-->>CLI: pass/fail
    CLI->>Config: loadConfig(cwd) → KigumiConfig
    CLI->>CLI: resolveRegistrySource(name, config) → URL
    CLI->>FS: fetchRegistryJson(source) via GitHub Raw API
    FS-->>CLI: CommunityRegistry
    CLI->>CLI: selectRemoteComponents (interactive)
    CLI->>CLI: resolveDependencies (topological sort)
    CLI->>FS: fetchFile + write (no template substitution — community files ship verbatim)
    CLI->>Config: update installedComponents provenance
    CLI-->>User: Added N component(s) from registry
```

### Template Pipeline

```mermaid
flowchart LR
    subgraph Input
        SRC["templates/{framework}/{Component}/\n{Component}.tsx (real source file)"]
        REG["registry.ts\nComponentDefinition\nprops, dependencies, files"]
        CFG["KigumiConfig\nframework, tier, typescript"]
    end

    subgraph TierResolution["Tier Swap"]
        DETECT["detectTier(cwd), once per command\nreads package.json, then the token\npassed down as a required tier"]
        PKG["getWebAwesomePackage(tier)\nfree → @awesome.me/webawesome\npro → @awesome.me/webawesome-pro"]
    end

    subgraph Processing
        READ["materializeTemplate(path, packageName)\nfs.readFile + replaceAll(\n/@awesome\\.me/webawesome(?!-pro)/g,\npackageName) when Pro"]
    end

    subgraph Output
        COMP[".tsx / .jsx / .vue / .js.vue"]
        CSS[".css (read verbatim — no substitution)"]
        INDEX["index.ts barrel export\nupdateComponentIndex"]
    end

    REG --> READ
    CFG --> TierResolution
    DETECT --> PKG --> READ
    SRC --> READ
    READ --> COMP
    CSS -.-> COMP
    COMP --> INDEX
```

---

## Debugging

| Problem | Check | Fix |
| --- | --- | --- |
| Components unstyled | `kigumi.ts` imports? | Confirm `layers.css` import. WA JS loads per-component on mount (no barrel). |
| TypeScript errors | `declare module 'react'`? | Use `declare global` instead |
| wa-\* type errors | `vite-env.d.ts` exists? | Run `generateViteEnvDts()` |
| Theme not applying | CSS imported? HTML classes? | Check `kigumi.ts` imports |
| Theme conflicts | Duplicate theme imports? | Verify `theme.css` has no `@import` |
| Tier wrong | Installed package, then token (env var, user npmrc, `.env`)? | Use `detectTier()` |
| Free→Pro fails | Migration ran? | Check `migration.ts` |
| Wrong import paths | Mixed free/pro imports? | Run `kigumi doctor` |
| Stale WA version | Config or package outdated? | Run `kigumi doctor` |
| Version mismatch | `kigumiVersion` in config? | Run `kigumi upgrade` |
| JSON parse fails | File has comments? | Use `readJSONWithComments()` |
| 401 in docs/ | `docs/.npmrc` present? | Run `pnpm run setup:npmrc` |
| 401 installing Pro in a user project | `.npmrc` reads `${WEBAWESOME_NPM_TOKEN}`, is it set in the shell? Else does the user npmrc hold the token? | Set the variable, or re-run `kigumi init` to bring an old registry-only `.npmrc` in line (`kigumi upgrade` does too when it installs a new Web Awesome version) |
| Broken error URLs | `https://https://` prefix? | Use constants from `src/constants.ts` (`GITHUB_ISSUES_URL`, `GITHUB_REPO_URL`) |
| Unhandled error | `catch {}` swallows error? | Always capture: `catch (_error) {}` with descriptive comment |
| Config validation | Generic `Error` thrown? | Use `ConfigInvalidError` from `src/errors/config.ts` |

---

## Common Mistakes

1. Editing generated code instead of the templates under `templates/`
2. Using `className` on `<wa-*>` elements (use `class`)
3. Using `declare module 'react'` (use `declare global`)
4. Event listeners in ref callback (use `useEffect`)
5. Using `fs.readJSON()` on files with comments
6. Storing tier in config (detect from `.env`)
7. Using `any` type (use `unknown` or proper types)
8. **Using `!important` to override Web Awesome styles** (use CSS layers - `theme.css` automatically overrides base)
9. **Manually editing `layers.css` or `kigumi.ts`** (auto-generated - use `kigumi theme` commands)
10. **Adding Web Awesome imports to `theme.css`** (all imports handled in `layers.css`)
11. Making assumptions - ask for help if unsure
12. **Manually editing community registry files** instead of using `kigumi registry` commands
13. **Importing `KigumiConfig` from `utils/config.ts`** (old interface, incomplete) — use `schemas/config.ts` (Zod-inferred, has `registries`, `installedThemes`, etc.)
14. **Hardcoding GitHub URLs** — use `GITHUB_ISSUES_URL` / `GITHUB_REPO_URL` from `src/constants.ts`
15. **Silent `catch {}` blocks** — always capture the error variable (`catch (_error)`) and add a descriptive comment explaining why it's intentionally ignored
16. **Using `process.exit()` in commands** — use `handleError(error, output)` from `src/errors/index.ts` for consistent error reporting

---

## Auto-Generated Files

| File | Purpose | Regenerated When | User-Editable |
| --- | --- | --- | --- |
| `src/lib/kigumi.ts` | Imports layers.css and applies theme classes to `<html>` | Theme/brand/palette commands | ❌ No |
| `src/styles/layers.css` | Wraps Web Awesome CSS in cascade layers | Theme/brand/palette commands | ❌ No |
| `src/styles/theme.css` | User custom CSS overrides | Only on init (if missing) | ✅ Yes - preserved |
| `src/vite-env.d.ts` | JSX augmentation importing official Web Awesome `CustomElements` / `CustomCssProperties` | Only on init (React Vite + TS); `kigumi doctor` advisory for legacy `src/types/web-awesome.d.ts` | ❌ No |
| `src/web-awesome.d.ts` | Next.js-flavored variant of `vite-env.d.ts` (no `vite/client` reference) | Only on init (Next.js + TS) | ❌ No |
| `src/styles/community-themes/*.css` | Downloaded community theme CSS | `kigumi theme install --from` | ❌ No |
| `.npmrc` (user project) | Registry URL, plus a `${WEBAWESOME_NPM_TOKEN}` reference on Pro unless the user npmrc holds the token; no secret. Merged into the existing file | On init, and before every Kigumi install | ✅ Yes - other lines are kept |
| `docs/.npmrc` | Registry + token (gitignored) | `pnpm run setup:npmrc` | ❌ No |

**Key Points:**

- `layers.css` uses CSS `@layer` for cascade control (base < theme)
- `layers.css` distinguishes built-in themes (from WA package) vs community themes (from `community-themes/` dir)
- `theme.css` is preserved on re-init - existing user styles won't be overwritten
- Theme/brand commands regenerate `kigumi.ts` + `layers.css` but preserve `theme.css`
- JSX type declarations (`vite-env.d.ts` / `web-awesome.d.ts`) augment `IntrinsicElements` with `CustomElements` from the official Web Awesome package. That covers every `wa-*` element (including the `class?` attribute and all WA events). Kigumi no longer hand-rolls per-component types; legacy `src/types/web-awesome.d.ts` files are flagged by `kigumi doctor`.

---

## Decision Trees & Checklists

### Decision Tree: Component Task Type

```
START: User requests component change
│
├─ "Add new component"
│  ├─ Check: Component in registry? → NO
│  │  └─ ACTION: Use generate-webawesome-component skill
│  │     └─ Creates templates → registry entry → tests
│  │
│  └─ Check: Component in registry? → YES
│     └─ ACTION: User wants to install it
│        └─ Run: `kigumi add <component>`
│
├─ "Fix/improve existing component"
│  ├─ Check: Issue in generated code?
│  │  └─ ACTION: Edit the framework template file
│  │     └─ Path: templates/{framework}/{ComponentName}/
│  │     └─ Rebuild: pnpm build
│  │     └─ Test: node dist/index.js add {component} --force
│  │
│  └─ Check: Issue in CLI logic?
│     └─ ACTION: Edit src/ files
│        └─ Commands: src/commands/
│        └─ Utils: src/utils/
│        └─ Test: pnpm test
│
└─ "Update component metadata"
   └─ ACTION: Edit src/utils/registry.ts
      └─ Update: name, tagName, importPath, tier, category, description, props
      └─ Validate: pnpm validate:registry
      └─ Test: pnpm test
```

### Decision Tree: Tier-Related Changes

```
START: Change affects tier detection or packages
│
├─ "Detect tier for project"
│  ├─ Priority 1: Check package.json dependencies
│  │  └─ @awesome.me/webawesome-pro → pro tier
│  │  └─ @awesome.me/webawesome → free tier
│  │
│  ├─ Priority 2: Check the WEBAWESOME_NPM_TOKEN environment variable
│  │  └─ Token present → pro tier
│  │
│  ├─ Priority 3: Check the user npmrc (~/.npmrc) for the Pro registry token
│  │  └─ Token present → pro tier
│  │
│  └─ Priority 4: Check .env for WEBAWESOME_NPM_TOKEN
│     └─ Token present → pro tier
│     └─ No token → free tier (default)
│
├─ "Change tier logic"
│  └─ ACTION: ONLY edit src/utils/tier.ts
│     └─ Functions: detectTier(), getWebAwesomePackage()
│     └─ Test: tests/unit/tier.test.ts
│
└─ "Add tier-restricted component"
   └─ ACTION: Edit src/utils/registry.ts
      └─ Set tier: 'pro' or 'free'
      └─ Validator: src/commands/add/validator.ts checks tier
      └─ Test: Add TierRestrictionError test
```

### Checklist: Before Committing Template Changes

- [ ] **Edited the framework template (not generated code)**
  - Path: `templates/{framework}/{ComponentName}/*.{tsx,jsx,vue,js.vue,component.ts,css}`
  - All frameworks: React AND Vue AND Angular
  - All variants: TypeScript AND JavaScript (Angular is TS-only)

- [ ] **Rebuilt CLI**
  - `pnpm build`

- [ ] **Generated & tested component**
  - `node dist/index.js add {component} --force`
  - Visual check: Component renders correctly
  - Browser test: Events work, styles apply

- [ ] **Verified template syntax**
  - No stray `{{...}}` tokens (caught by `pnpm validate:templates` and the `no-handlebars-tokens` unit test)
  - React: `class` not `className` for `<wa-*>`
  - TypeScript: Named imports, interfaces
  - JavaScript: Default import, JSDoc

- [ ] **Updated tests**
  - Function: the React, Vue and Angular function harnesses (`*-function-harness-registry.test.ts`) prove every TypeScript Template from its metadata, and `validate:generated-fresh` Check C holds the `.jsx` / `.js.vue` to it; there is no per-Template test to write
  - Types: `pnpm typecheck:templates` typechecks the committed Templates against the shims, and the consumer tsc suites (`tests/e2e/consumer-tsc-*.test.ts`) typecheck `init` + `add --all` output in a strict Free and Pro project (React against both React 19 and React 18 types)
  - Snapshot: Visual regression (if applicable)

### Checklist: Before Adding New Component

- [ ] **Component documentation ready**
  - Web Awesome docs URL
  - Component tag name (e.g., `wa-button`)
  - Import path pattern
  - Props list with types and defaults

- [ ] **Registry entry complete**
  - Name (PascalCase)
  - tagName (kebab-case, starts with `wa-`)
  - importPath (@awesome.me/webawesome/...)
  - tier ('free' or 'pro')
  - category (matches existing categories)
  - description (concise, user-facing)
  - props (array of objects with name, type, default, description)

- [ ] **Templates created (all frameworks)**
  - `templates/react/{ComponentName}/{ComponentName}.tsx`
  - `templates/react/{ComponentName}/{ComponentName}.jsx`
  - `templates/react/{ComponentName}/{ComponentName}.css`
  - `templates/vue/{ComponentName}/{ComponentName}.vue`
  - `templates/vue/{ComponentName}/{ComponentName}.js.vue`
  - `templates/vue/{ComponentName}/{ComponentName}.css`
  - `templates/angular/{ComponentName}/{kebab-name}.component.ts`
  - `templates/angular/{ComponentName}/{kebab-name}.component.css`
  - Nothing else: `pnpm validate:templates` fails on any other file, a per-Template test included (issue #80)

- [ ] **Validation passed**
  - `pnpm validate:registry` → ✅
  - `pnpm validate:templates` → ✅
  - `pnpm test` → ✅

- [ ] **Docs site & agent surfaces (hand-maintained — no validator catches these)**
  - `docs/src/components/ui/{ComponentName}/` wrapper + export in `docs/src/components/ui/index.ts`
  - `docs/src/stories/{ComponentName}.stories.tsx` with argTypes, a `ChromaticOnly` story, and (if the component emits events) an `interaction`-tagged `Default` story with a `play` function
  - Interaction-test lane registration: add the story file to BOTH `docs/.storybook-test/main.ts` (`stories`) and `docs/vitest.storybook.config.ts` (`server.warmup.clientFiles`)
  - Components overview grid: entry in `componentsByCategory` in `docs/src/components/storybook/StorybookComponentGrid.tsx` + 920×600 dark-theme PNG in `docs/src/assets/components/`
  - Relevant `kigumi-compose-*` skill selection tables (e.g. form controls → `kigumi-compose-form/SKILL.md` + `references/form-component-cheatsheet.md`)
  - Component counts in `templates/AGENTS.md` and `.claude/skills/kigumi-angular/SKILL.md`

### Checklist: Web Awesome Version Bump

The code/registry side is guarded by validators (`validate:cem-sync`, `validate:registry`, `validate:generated-fresh`, `validate:wa-pins`). The surfaces below are **hand-maintained** and were the source of all drift found in the WA 3.7.0–3.10.0 audit (PR #220). Walk this list on every bump:

- [ ] **Pins** (now enforced — run `pnpm validate:wa-pins`): `package.json`, `docs/package.json`, `docs/kigumi.config.json`, root `kigumi.config.json` (dogfooding), `src/constants.ts` `DEFAULT_WEBAWESOME_VERSION`, `src/utils/version-map.ts` newest entry. All six must name the same exact version. **Adding the `version-map.ts` entry is not optional**: `kigumi upgrade` installs whatever the newest entry names, so skipping it makes upgrade hand users an older Web Awesome than the CLI ships.
- [ ] **Starters** (merge before the bump PR): in `kigumi-ui/kigumi-{react,vue,angular,next}-starter`, set `@awesome.me/webawesome` in `package.json` and `webAwesome.version` in `kigumi.config.json` to the new exact version, `pnpm install`, then `pnpm run typecheck && pnpm run build`. The Starter job's `check:starter-wa-version` step fails while a starter is older than `DEFAULT_WEBAWESOME_VERSION`, and a Web Awesome bump changes `package.json`, so all four starters run on the bump PR. Regenerating a starter's components (`kigumi update`) changes files the Starter fixtures record: refresh them with `pnpm run update:starter-snapshots` against the updated starters after that, never before.
- [ ] **Regenerate**: `pnpm generate:metadata && pnpm generate:templates && pnpm generate:skill-refs && pnpm generate:pro-shim`. The Pro typecheck shim is the step that used to be forgotten (it missed 3.10 and 3.13); `validate:generated-fresh` Check A now fails on a stale one
- [ ] **New upstream components**: either full wrapper (run the "Before Adding New Component" checklist above, including the docs-site items) or an explicit entry in `INTENTIONALLY_UNWRAPPED` in `scripts/validate-cem-sync.ts` with rationale
- [ ] **Changed props/defaults/enum values**: check every changelog line against templates, `docs/src/components/ui`, stories, and registry prop values (`validate:cem-sync` now holds registry defaults to the CEM, and `validate:stories` holds the argTypes `defaultValue` summaries to the registry) — new enum values need a demo story (e.g. Tree `leaf-multiple`)
- [ ] **Removed CSS custom properties / parts**: grep repo-wide for the removed name; also confirm it is absent from `kigumi-theme` references
- [ ] **Theme token docs**: re-validate `.claude/skills/kigumi-theme/references/css-variables.md` and `available-themes.md` against the new `dist/styles/themes/default.css` and palette/theme file listing; bump the "Source:" footer version
- [ ] **Skill tables**: new components reflected in the relevant `kigumi-compose-*` skills; regenerated `.claude/skills/shared/*-api-surface.md` committed
- [ ] **AGENTS.md sync**: component counts in root, `src/`, `templates/`, `tests/` AGENTS.md — `templates/AGENTS.md` is the one that historically gets missed
- [ ] **Storybook grid**: new components added to `StorybookComponentGrid.tsx` + thumbnail PNGs
- [ ] **Zero-warning gate**: `pnpm validate:cem-sync` must pass with 0 warnings (new unwrapped components and new attributes on wrapped components must be consciously triaged, not left warning: surface the attribute as a registry prop, or add a `backfill`/`intentional` entry to `COMPONENT_ATTRIBUTE_ALLOWLIST` with a reason). An attribute Web Awesome removed leaves its allowlist entry stale, which is an error: delete the entry. An attribute Web Awesome newly deprecates warns until its registry prop carries `deprecated` (in Kigumi's own words)
- [ ] **Runtime-backed `intentional` entries**: some `COMPONENT_ATTRIBUTE_ALLOWLIST` entries rest on how the build behaves, not on the CEM, so `validate:cem-sync` stays green when a bump changes that. The comments above `INERT_ON_AXISLESS_CHART` and `COMPONENT_ATTRIBUTE_ALLOWLIST` in `scripts/validate-cem-sync.ts` list them: when a bump touches one of those components, re-check them against the new build and surface any attribute that now works

### Checklist: Before Merging PR

- [ ] **All tests pass**
  - Unit tests: `pnpm test`
  - Integration tests: `pnpm test:integration`
  - Linting: `pnpm lint`
  - Type-check: `pnpm type-check`

- [ ] **Validation scripts pass**
  - Registry: `pnpm validate:registry`
  - Templates: `pnpm validate:templates`
  - Changes: `pnpm validate:changes`

- [ ] **CI pipeline green**
  - Lint & Format job
  - Test job (Node 22)
  - Integration Tests job
  - Coverage job (>=63%)
  - TypeScript Check job
  - Validate Registry & Templates job
  - License Check job
  - Security Audit job
  - Chromatic visual regression job

- [ ] **Documentation updated**
  - CHANGELOG.md (if user-facing)
  - README.md (if CLI changes)
  - AGENTS.md (if workflow changes)

- [ ] **No regressions**
  - Existing components still generate
  - Existing tests still pass
  - No tier logic broken

### Checklist: Debugging Failed Generation

- [ ] **Check template completeness**
  - Run: `pnpm validate:templates`
  - Look for: Missing files per framework, stray `{{...}}` tokens

- [ ] **Check registry consistency**
  - Run: `pnpm validate:registry`
  - Look for: Wrong paths, missing props, duplicates

- [ ] **Check tier detection**
  - Run: `pnpm run doctor`
  - Look for: Wrong package imports (free vs pro)

- [ ] **Check TypeScript compilation**
  - Templates: `pnpm typecheck:templates`. `pnpm typecheck:templates:pro` checks only the Vue Templates, and only with the docs dependencies installed with the Pro token; without them every import fails with "Cannot find module", which is not a Template error
  - Generated output: `pnpm build`, then `pnpm test:e2e tests/e2e/consumer-tsc-react.test.ts` (or the `-vue` / `-angular` suite). The React suite includes the Next ambient pass and the React 18 pass. A Pro consumer reports NOT verified where this machine cannot install the pinned Pro package
  - Look for: Type errors in generated code

- [ ] **Check runtime errors**
  - Start dev server with generated component
  - Open browser console
  - Look for: Import errors, undefined references

---

## Questions Before Changes

1. Does this need template changes (`templates/{framework}/{Component}/`)?
2. Works with React 18 AND 19?
3. Tier restrictions correct?
4. TypeScript errors for users?
5. Web components need imports?
6. Event listeners cleaned up?
7. Tested in browser?

---

## Release Workflow

> **For AI Agents:** This section documents the release process. Follow these steps strictly for consistency.

### Overview

Fully automated release pipeline: **merge PR to main = release** (when changesets exist).

```mermaid
flowchart LR
    A[Feature Branch] --> B[pnpm changeset]
    B --> C[Push + Create PR]
    C --> D[CI Runs]
    D --> E{CI Green?}
    E -->|Yes| F[Review + Merge PR]
    E -->|No| G[Fix Issues]
    G --> C
    F --> H[Release Workflow]
    H --> I[Auto: Version Bump + CHANGELOG]
    I --> J[Auto: npm Publish + GitHub Release]
```

**Control points:**

- Review PR before merge (full control over what ships)
- CI must pass before merge (quality gate)
- No manual steps after merge (fully automated)

### Developer Workflow

**Step 1: Create feature branch and make changes**

```bash
git checkout -b feat/my-feature
# ... make changes ...
git add .
git commit -m "feat: add new component"
```

Rules:

- Use conventional commit messages (feat/fix/docs/chore/refactor)
- **NEVER** use `--amend` on pushed commits
- **NEVER** rebase after pushing

**Step 2: Create changeset (if user-facing)**

| Change Type           | Changeset? | Severity | Examples                   |
| --------------------- | ---------- | -------- | -------------------------- |
| New component         | Yes        | `minor`  | Add Dialog component       |
| New CLI command       | Yes        | `minor`  | Add `kigumi theme` command |
| Bug fix (user-facing) | Yes        | `patch`  | Fix Button event handler   |
| Breaking change       | Yes        | `major`  | Remove deprecated prop     |
| Docs only             | No         | -        | Update README              |
| Tests only            | No         | -        | Add unit tests             |
| Refactor (internal)   | No         | -        | Reorganize utils           |
| CI/Build changes      | No         | -        | Update GitHub Actions      |

```bash
pnpm changeset
# Select patch/minor/major, write user-facing summary
git add .changeset/*.md
git commit -m "chore: add changeset"
```

The summary **must** start with a Keep a Changelog category header (`### Added` / `### Changed` / `### Fixed` / `### Deprecated` / `### Removed` / `### Security` / `### Breaking Changes`), e.g.:

```markdown
### Fixed

- **Scope**: What was broken and what changed
```

Content without a header is silently dropped from `CHANGELOG.md` at release time (`scripts/post-changeset-version.ts` only buckets lines that follow a header). `pnpm validate:changesets` (wired into CI) catches this before merge — see `.claude/skills/release/SKILL.md` for the full format.

**Step 3: Push and create PR**

```bash
git push -u origin HEAD
gh pr create --draft --title "feat: my feature" --body-file body.md
```

The PR body becomes the squash commit on main, so it is written as history: a summary and four sections, per `.github/PULL_REQUEST_TEMPLATE.md`. Review rounds and evidence go in the PR log, one new comment per push. Use the `pr-log` skill when opening a PR and after every push to one; `pr-body.yml` and the `pr-log` status enforce it (`docs/adr/0006`). When `/code-review` runs on a PR, give its Spec sub-agent the PR body and the log comments too, and have it report body claims the diff does not back and user-facing changes the body omits.

**Step 4: Wait for CI, review, merge**

All checks must pass before merge:

- Lint & Format
- Test (Node 22)
- Integration Tests
- Coverage (>=63%)
- TypeScript Check
- Validate Registry & Templates
- License Check
- Security Audit
- Chromatic (visual regression)

Once CI passes and review is approved, merge via GitHub UI (squash or merge commit, no rebase).

### What Happens After Merge (Fully Automated)

1. **Release workflow** (`.github/workflows/release.yml`) triggers on push to main
2. **The release job** installs, builds, smoke-tests the packed tarball and checks its contents; it does not re-run `ci.yml`, which triggers on pull requests only
3. **If changesets exist:**
   - `changeset version` bumps `package.json` and updates `CHANGELOG.md`
   - `pnpm build && changeset publish` builds and publishes to npm
   - GitHub Release with git tag is created automatically
4. **If no changesets:** Nothing happens (no release)

### Manual Release (Emergency Only)

If automation fails:

```bash
pnpm changeset version
pnpm release
```

**NEVER do this** unless automation is broken. Document reason in a follow-up PR.

### Branch Protection

**main** branch is protected:

- Require PR before merging
- Require status checks: Quality Checks, Test, Detect changes, PR body and pr-log
- Require conversation resolution
- No force push allowed
- No direct commits

### CI Optimization (Path-Aware Gating)

To stay inside the GitHub Actions allowance, `ci.yml` runs heavy jobs only when relevant paths change. The `changes` job (top of `ci.yml`) uses `dorny/paths-filter@v4` to compute outputs (`docs`, `src`, `templates`, `integration`, `e2e`, `starters`, `story`, `deps`), and each gated job's `if:` predicate references those outputs.

**Always-on jobs:** `quality`, `test`, `pack-test`. Branch protection requires `quality` and `test` (with `changes` and the `PR body` and `pr-log` checks), not `pack-test`.

**Path-gated jobs:** `integration`, `e2e`, `starters`, `docs-typecheck`, `story-interactions`. Skipped if paths don't match.

**Override mechanisms (force every heavy job to run):**

1. Add the `full-ci` label to the PR. The `labeled` PR trigger re-fires CI, and every gated job's `if:` falls through to the override branch.
2. Push to a branch named `changeset-release/main`. The changesets-bot Version Packages PR uses this head ref, so pre-release CI is always exhaustive.

**When to add a new path filter:** any time a new top-level directory or file pattern lands that should drive a heavy job. Update the `changes` job's `filters:` block in `ci.yml` and adjust the relevant gate. If you add a top-level directory that doesn't fit any existing filter, the safest default is to add it under `deps` (which is in every heavy gate) until you know which job it should drive.

**`visual-test` label** is a separate, narrower override that forces the Chromatic job to run when no visual paths changed. It is unrelated to `full-ci`.

**Dynamic matrix size (Starter):** beyond skipping jobs entirely, the `changes` job also computes the Starter job's matrix and emits it as a JSON output (`starter_matrix`). The Integration job is a single lane: its suites do not vary by framework.

| Trigger | Starter matrix |
| --- | --- |
| `full-ci` label or `changeset-release/main` | 4 entries (react, vue, angular, next) |
| `templates` or `deps` changed | 4 entries |
| `src` (or `integration` / `starters` / `e2e`) only | 1 entry (react) |

The reduction is safe because: (1) starter coverage for non-react frameworks is high-value only when templates or deps change; (2) any regression missed on a regular PR is caught at the next release PR (full matrix auto-fires on `changeset-release/main`) before publish. To force the full matrix on a regular PR, add the `full-ci` label.

### Troubleshooting

| Problem                | Solution                                          |
| ---------------------- | ------------------------------------------------- |
| CI fails on main       | Fix in new PR, do not force push                  |
| Release workflow fails | Check NPM_TOKEN secret in GitHub                  |
| No release after merge | Ensure `.changeset/*.md` files were in the PR     |
| Publish fails          | Verify package.json version not already published |
| Wrong version bumped   | Recreate changeset with correct severity          |

### Quick Reference

```bash
# Create changeset (user-facing changes only)
pnpm changeset

# Check what will be released
pnpm changeset status

# Local test before merge
pnpm build && pnpm test && pnpm lint && pnpm type-check

# View CI status
gh pr checks

# Pre-release: aggregate gates + state-file meta-checks into a Go/No-Go report
# (writes .claude/reports/release-readiness-YYYY-MM-DD.md)
pnpm release-readiness               # full run
pnpm release-readiness:quick         # skip e2e
```

---

## Related Documentation

- **Critical rules:** [CLAUDE.md](CLAUDE.md) - Always-in-context rules for Claude Code
- **Templates:** [templates/AGENTS.md](templates/AGENTS.md) - Component generation patterns
- **Source:** [src/AGENTS.md](src/AGENTS.md) - Code architecture details
- **Tests:** [tests/AGENTS.md](tests/AGENTS.md) - Testing guidelines
- **Kigumi Studio:** [docs/src/kigumi-studio/AGENTS.md](docs/src/kigumi-studio/AGENTS.md) - Visual theme builder
