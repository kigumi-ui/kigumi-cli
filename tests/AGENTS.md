# Testing Guide

> Test suite for Kigumi CLI - extends [root AGENTS.md](../AGENTS.md)

## Directory Structure

```
tests/
├── unit/                    # Fast, isolated tests (more under eslint-rules/, scripts/, schemas/)
│   ├── add-command.test.ts          # Add command (built-in + remote)
│   ├── add-command-cross-framework.test.ts # Add command --cross-framework flag
│   ├── add-print-summary.test.ts    # printSummary's four reporting concerns
│   ├── add-validator.test.ts        # Component validation
│   ├── brand-command.test.ts        # Brand color command
│   ├── check-runner.test.ts         # Pre-flight check runner
│   ├── component-installer.test.ts  # Component installer logic
│   ├── community-registry.test.ts   # Registry schema, URL parsing, deps
│   ├── concurrency.test.ts          # Cluster T: saveConfig load-modify-write race + write-failure propagation
│   ├── failure-modes.test.ts        # Cluster T: disk (ENOSPC/EACCES) + GitHub fetcher (401/403/429/404) + network (ECONNREFUSED)
│   ├── component-selector.test.ts   # buildSelectorChoices + selectComponents dispatch
│   ├── config.test.ts               # Config loading/saving
│   ├── config-checks.test.ts        # Config validation checks
│   ├── config-error-surface.test.ts # Config error surface (cluster A: ConfigInvalidError vs TypeError)
│   ├── config-schema.test.ts        # Zod config schema validation
│   ├── consumer-premise.test.ts     # resolveProPackage + consumerPremise + reportNotRun: a Pro consumer tsc whose pinned Pro package cannot be installed is skipped (locally, fork and Dependabot PRs) or failed (CI), never a pass; CI only ever takes the run branch on this repo's PRs, so this holds the other two (#79)
│   ├── ci-e2e-pro-step.test.ts      # Executes the e2e job's `Check Pro registry access` shell for every kind of run (same-repo, fork, deleted fork, Dependabot, non-PR events) and pins the token's scope: no step before the auth line sees it, and only the Pro consumer step, with install scripts off, runs after it (#79)
│   ├── detect-framework.test.ts     # Framework/TS/PM detection
│   ├── diff-command.test.ts         # Diff command (component comparison)
│   ├── diff-renderer.test.ts        # Diff renderer terminal output
│   ├── diff-roundtrip.test.ts       # Diff renderer round-trip fidelity
│   ├── deprecated-props.test.ts     # Registry `deprecated` props (issue #129): TypeScript must report the deprecation (6385) to a consumer of a generated React Template and of both Vue dialects' props types, and every .tsx/.jsx typedef/.vue/.js.vue/Angular Template, docs wrapper and story must state exactly the registry's deprecations, both directions
│   ├── display-options.test.ts      # Theme/palette/brand display data
│   ├── doctor.test.ts               # Doctor command (import fixes)
│   ├── docs-wrapper-callback-refs.test.ts # Docs UI wrappers must use callback refs on wa-* hosts (WA 3.13 JSX)
│   ├── edge-cases.test.ts           # Edge case handling
│   ├── error-classes.test.ts        # Error class hierarchy
│   ├── errors.test.ts               # Error formatting
│   ├── file-diff.test.ts            # File modification detection
│   ├── scripts/resolve-cem.test.ts  # resolveCem: tier preference, root-scoping, no worktree escape (#43), pinned-version selection (F-152)
│   ├── scripts/cem-completeness.test.ts # Check A's all-or-nothing CEM gate (#43)
│   ├── scripts/guard-outcome.test.ts    # Shared guard reporting: skip is never a pass (#43)
│   ├── scripts/is-entry-point.test.ts   # Entry-point check matches through a symlinked directory (#106)
│   ├── scripts/check-starter-wa-version.test.ts # Starter job guard: a starter older than DEFAULT_WEBAWESOME_VERSION fails, numeric compare, missing install fails (#138)
│   ├── parse-custom-elements-import.test.ts # Importing the parser never starts main() (#106)
│   ├── scripts/validate-cem-sync-coverage.test.ts # cem-sync two-half coverage reporting (presence, and the manifest half: prop-value + attribute drift)
│   ├── scripts/pr-body-rules.test.ts # PR body rules (headings, noise constructs, size, attribution, claims vs the diff), body-edit ratio and trail, rewrites since ready from the edit history, log coverage and the pr-log status (#150)
│   ├── scripts/pr-body-context.test.ts # Git facts for the PR guards on real temp repos: changeset bump and known paths (also once main moved on), branch commits, the PR's merge base via a clone, rev-list ranges (#150)
│   ├── framework-detection.test.ts  # Extended framework detection
│   ├── github-token.test.ts         # GitHub PAT resolution chain
│   ├── helpers.test.ts              # Cluster S helpers (createRecordingOutput, createTestPrompts, writeTierFixture)
│   ├── init-config-preservation.test.ts # Init with config preservation scenarios
│   ├── init-existing-config.test.ts # Init with existing project
│   ├── init-file-generator.test.ts  # Init file generator (per-framework setup file emission)
│   ├── dependency-installer.test.ts # npm/pnpm install + package cleanup
│   ├── init-validate-and-prepare.test.ts # Init pre-flight validation + prep
│   ├── json.test.ts                 # JSON with comments parsing
│   ├── list.test.ts                 # List command
│   ├── list-json.test.ts            # List --json output
│   ├── migration.test.ts            # Free↔Pro migration
│   ├── network-errors.test.ts       # Network error classes
│   ├── next-support.test.ts         # Next.js detection + 'use client' + suppressHydrationWarning + layers.css emission (App + Pages)
│   ├── no-handlebars-tokens.test.ts # Regression guard: no `{{...}}` tokens in any template
│   ├── options-schema.test.ts       # Command options schemas
│   ├── package-json.test.ts         # readDependencies contract (missing, unreadable, not a JSON object) + what each detection caller does with each error (issue #99)
│   ├── package-json-read-error.test.ts # PackageJsonReadError / PackageJsonInvalidError + what `kigumi list`, `init`, `upgrade`, `brand`, `theme install` and `diff` print for a broken package.json, and that the writing commands changed nothing (issues #99, #121)
│   ├── output-di.test.ts            # Output DI hook (setOutputForTesting / resetOutputForTesting)
│   ├── palette-command.test.ts      # Palette command
│   ├── preflight-errors.test.ts     # Pre-flight error classes
│   ├── project-config.test.ts       # Project config helpers
│   ├── prompts-wrapper.test.ts      # Prompts wrapper (setPromptsForTesting routing)
│   ├── react-function-harness.test.ts # jsdom CEM function harness tracer for the committed Dialog Template (issue #74)
│   ├── react-function-harness.ts    # proveReactTemplate: the React adapter (`onAfterHide`, ref handle) over template-function-harness.ts (not a test file)
│   ├── react-function-harness-registry.test.ts # Loops proveReactTemplate over every LOCAL_REGISTRY component (issue #75); fails closed on a missing COMPONENT_METADATA entry, on an emptied attributes/methods list, and asserts public CEM methods reach the host via the exposed ref
│   ├── regenerate.test.ts           # File regeneration utilities
│   ├── relaxed-compile-check.test.ts # Pins the relaxed generate-then-tsc check until it is removed (issue #73)
│   ├── remote-component-selector.test.ts # getAvailableRemoteComponents + cancel path
│   ├── remote-installer.test.ts     # Remote (community) component installer
│   ├── remote-installer-cross-framework.test.ts # Cross-framework staging branch
│   ├── remote-installer-local-source.test.ts    # Local filesystem registry source
│   ├── registry.test.ts             # Component registry lookups
│   ├── registry-add-component.test.ts     # Registry add-component command
│   ├── registry-add-theme.test.ts         # Registry add-theme command
│   ├── registry-cache.test.ts       # Disk cache for registries
│   ├── registry-connect-command.test.ts   # Registry connect command (mismatch warning)
│   ├── registry-init-command.test.ts      # Registry init command
│   ├── registry-list-remove-command.test.ts # Registry list/remove
│   ├── registry-router.test.ts            # Registry router structural + wiring
│   ├── registry-validate-command.test.ts  # Registry validate command
│   ├── status.test.ts               # Status command
│   ├── slider-range-values.test.ts  # Slider `min-value` / `max-value` stay off the host until set, in every React and Vue variant: `wa-slider` resets a range to them by presence (#102)
│   ├── snapshot.test.ts             # Snapshot CRUD and community install snapshots
│   ├── status-json.test.ts          # Status --json output
│   ├── storybook-generator.test.ts  # Storybook story generation; `parseStory` / `argTypeDefaultSummary` / `sameDefault`, which `validate:stories` uses to hold argType default summaries to the registry, including comments with quotes and every unreadable shape (#152)
│   ├── surgical-rewrite-layers-css.test.ts # Surgical @import rewrite for layers.css
│   ├── template.test.ts             # Template materialization + tier swap
│   ├── enumerated-boolean-attributes.test.ts # The enumerated-boolean pin against the real Free runtime (every Free element's Lit `elementProperties`, both directions, keywords read back) and the registry `keywords` against the pin (issue #101)
│   ├── enumerated-boolean-templates.test.ts # `spellcheck`/`autocorrect` through every React and Vue variant incl. `.jsx`/`.js.vue` and the docs-site wrappers, moved true -> false -> unset on one mount: keyword, keyword, removed (issue #101)
│   ├── template-registry-props.test.ts # Every registry prop is a member of the React `<Name>Props` interface, a declared prop of the `.vue` Template (`modelValue` in place of the `v-model` attribute), and, where a hand-maintained `.jsx` documents its props, an entry there: a `@property` of its `<Name>Props` JSDoc typedef (pinned both ways as `JSX_PROPS_TYPEDEFS`) or an `@param` of its `@param {Object} props` list (`JSX_PROPS_PARAMS`, #102); the Angular half is the Angular registry harness (issue #101)
│   ├── template-function-harness.ts # proveTemplate: the framework-neutral CEM function contract all three adapters share, incl. the host add/removeEventListener log; `className: null` skips the class check for an adapter with no class seam yet (Angular, #125) (not a test file)
│   ├── theme.test.ts                # Theme validation
│   ├── theme-commands.test.ts       # Theme set/list/show/install commands
│   ├── theme-install-local-source.test.ts  # `theme install --from` with a local registry
│   ├── three-way-merge.test.ts      # Three-way merge algorithm
│   ├── tier.test.ts                 # Tier detection
│   ├── tier-consistency.test.ts     # Registry/tier consistency validation
│   ├── tier-restrictions.test.ts    # Tier restriction logic
│   ├── tier-schema.test.ts          # Tier schema validation
│   ├── token.test.ts                # Token handling
│   ├── type-installation.test.ts    # TypeScript type installation
│   ├── update-check.test.ts         # CLI update notification check
│   ├── update-command.test.ts       # Update command (three-way merge)
│   ├── upgrade-command.test.ts      # Upgrade command (version management)
│   ├── validate-changes.test.ts     # AI guard-rail checks + anti-pattern matcher
│   ├── validate-cem-sync.test.ts    # CEM sync validation; checkAttributeDrift table tests: missing, allowlisted, with-* hints, camelCase CEM names, every stale-entry direction (#100); parseCemAttributes and checkDeprecationDrift table tests: both drift directions, Kigumi-side deprecations, every stale KIGUMI_DEPRECATIONS direction, the absent-attribute message, countDrift on literal findings (#133)
│   ├── validate-parity.test.ts      # Template parity validation
│   ├── validate-parity-detection.test.ts  # Parity detection proven on a synthetic registry
│   ├── validate-wa-pins.test.ts     # Web Awesome pin consistency across all six locations
│   ├── post-changeset-version.test.ts  # Release version markers (AGENTS.md + llms.txt)
│   ├── validate-registry.test.ts    # Registry validator (fields, props, tags)
│   ├── parse-custom-elements-css.test.ts  # CEM → CSS_METADATA extraction + framework parity
│   ├── parse-custom-elements-types.test.ts # Shared metadata types: generated modules import+re-export, never re-declare (issue #34)
│   ├── parse-custom-elements-attributes.test.ts # extractAttributes: boolean-vs-string classification, untyped attributes kept (did-ssr), otp-input/pagination/tag-input coverage (issue #105)
│   ├── parse-custom-elements-params.test.ts # paramType: a CEM parameter without a type is typed from its default, else `unknown`, never `any`; the committed COMPONENT_METADATA carries no `any` parameter (issue #136); methodParameters marks a parameter optional when flagged or defaulted and nothing required follows (issue #108)
│   ├── parse-custom-elements-events.test.ts # buildMetadata: manifest artifacts dropped, the event they shadow kept; a partial (free) manifest lacking a pinned entry's component parses, a complete one refuses the entry (issue #108)
│   ├── validation-errors.test.ts    # Validation error classes
│   ├── version-check.test.ts        # CLI vs project version check
│   ├── check-commit-attribution.test.ts # Commit-message matcher: rejects AI attribution trailers, accepts prose mentioning Claude (cluster S)
│   ├── validate-agents.test.ts      # Pure matchers for templates/AGENTS.md count claims and for history (date stamp, changelog heading) in agent context files; checkNoHistory() on a temp git repo
│   ├── validate-gha-permissions.test.ts # Pure matcher for GHA job-level permissions vs actions/checkout (cluster V)
│   ├── validate-gha-issue-writes.test.ts # Pure matchers for `gh issue` writes in PR-triggered workflows: trigger forms, read vs write subcommands, which `if:` shapes gate off pull_request (issue #147)
│   ├── pre-tool-guardrails.test.ts  # Drives the PreToolUse hook end-to-end against real throwaway git repos: default-branch guard, worktree exemption, escape hatch (cluster T)
│   ├── validate-story-lanes.test.ts # Matchers for the interaction-lane story list vs the `interaction` tags on disk (cluster O)
│   ├── validate-fixture-exclusions.test.ts # Matchers for the three ignore lists that must all skip tests/fixtures/starter-snapshots (cluster X)
│   ├── version-error.test.ts        # Version error classes
│   ├── version-map.test.ts          # Version history data
│   ├── angular-function-harness.ts  # proveAngularTemplate: the Angular adapter (JIT compile, `k-` selector, declared @Input()/@Output() via toAngularOutputName, component instance, `style` seam, ControlValueAccessor through a real [formControl]) over template-function-harness.ts (not a test file)
│   ├── angular-function-harness-registry.test.ts # Loops proveAngularTemplate over every LOCAL_REGISTRY component's `.component.ts` Template (issue #77); pins the form-control catalogue (ControlValueAccessor) and the host property each maps to, both directions; an attribute may lack an @Input() only where `_helpers/angular-omitted-inputs.ts` pins it, and every pinned attribute must really lack one
│   ├── angular-function-harness.test.ts # The Angular adapter alone, on inline JIT components: compile errors reported not thrown, selector, undeclared inputs/outputs, omittable inputs, style seam, each ControlValueAccessor facet (issue #77)
│   ├── angular-templates.test.ts    # Angular template generation validation (collision-resolution exercised against Tooltip — Dialog is no longer a collision case since WA 3.5.0 marked its show()/requestClose() private)
│   ├── vue-function-harness.ts      # proveVueTemplate: the Vue adapter (`onWaAfterHide`, defineExpose, declared emits) over template-function-harness.ts (not a test file)
│   ├── vue-function-harness.test.ts # The Vue adapter alone, on inline components: callback naming, undeclared emits, a leak Vue's post-unmount emit would hide (issue #76)
│   ├── vue-function-harness-registry.test.ts # Loops proveVueTemplate over every LOCAL_REGISTRY component's `.vue` Template (issue #76); pins the v-model Templates and the attribute each model carries
│   ├── vue-js-host-defaults.test.ts # Every `.js.vue` mounted with no props writes the same host attributes as its `.vue`: no registry default reaches the host (#152)
│   ├── vue-templates.test.ts        # Every .vue and .js.vue Template forwards through hostAttributes() and cleans up in onBeforeUnmount
│   ├── scripts/
│   │   ├── check-generated-fresh.test.ts       # Pure helpers of the validate:generated-fresh drift guard (CSS comment-strip, rule-block split, at-rule guard, docs-only allowlist, event-subset, Check A's two-way Template tree diff, issue #80), plus Check C's Vue arm (issue #122): the SFC surface reader (including its plain-`<script>` reader) on literal snippets and, for the `<script setup>` half, against the Vue compiler on every committed Template; the variant comparer; and the templates/vue and templates/react walks (one pair per registry component)
│   │   ├── check-tests-baseline.test.ts        # Tests for the tsc baseline gate wrapper
│   │   ├── generate-angular-templates.test.ts  # Snapshot-pinned Angular wrapper generator (Button + Badge); output linted as a consumer (issue #136)
│   │   ├── generate-react-templates.test.ts    # Snapshot-pinned React wrapper generator (Button + Badge); output linted as a consumer (issue #136)
│   │   ├── generate-vue-templates.test.ts      # Snapshot-pinned Vue wrapper generator (Button + Badge + Switch); both dialects linted as a consumer (issue #136)
│   │   ├── generate-templates-output.test.ts   # Each of the three generators writes exactly its part of getTemplateFileNames(), no per-Template test (issue #80), with filenames taken verbatim from component.name
│   │   ├── generate-skill-references.test.ts   # formatCompactProps: the compact prop list the skill API surfaces print, including the `deprecated` label (issue #129)
│   │   ├── method-parameter-parity.test.ts     # Every registry method's parameter optionality is the metadata's in React (ref interface + handle), Vue (defineExpose) and Angular (method + cast); the React JSDoc ref example calls a method with no required argument
│   │   ├── generator-utils.test.ts             # formatParameters / callableWithoutArguments; custom method-param type imports (sibling Wa* vs named self); event-class imports from dist/events (formatEventTypeImports); the enumerated-boolean emitters (narrowing, named pair literal, keyword expression)
│   │   ├── event-types.test.ts                 # Event-class resolution (scripts/event-types.ts): dist/events d.ts parsing, override > registered class > declared type > NATIVE_EVENT_TYPES, every refusal (including a non-`wa-` event typed with an event class), stale overrides, `MANIFEST_EVENT_ARTIFACTS` entries (recognised, refused when wrong, reported when stale), and every event of the installed manifest
│   │   ├── event-type-parity.test.ts           # Metadata eventType invariants (wa- events are Wa*Event classes with a module, natives are DOM interfaces, never CustomEvent, and no manifest artifact for any component, wrapped or not) and React/Vue/Angular each typing + importing it for every registry event. The React prop is found through the listener that subscribes to the event, never derived with the generator's helper; React names are pinned on hard-coded cases; hand-maintained `.jsx` JSDoc handler types must match the `.tsx`
│   │   ├── post-changeset-version.test.ts      # Snapshot-pinned changeset → Keep-a-Changelog rewrite
│   │   └── validate-templates.test.ts          # A Template directory holds exactly getTemplateFileNames(): a missing file and any other file (a per-Template test in particular) both fail, dotfiles skipped (issue #80)
│   ├── eslint-rules/
│   │   ├── harness.test.ts                     # Cluster D: proves the eslint-plugin-kigumi RuleTester harness runs in the unit lane and that a namespaced rule reaches real files via flat config
│   │   └── templates-consumer-rules.test.ts    # Resolves eslint.config.js for every Template file and fails when a consumer-baseline rule is off or has other options there, `no-undef` excepted, and when that exception no longer excuses anything (issue #136)
│   ├── schemas/
│   │   ├── config-corrupt.test.ts              # Cluster T: corrupt-config edge cases (BOM, trailing comma, truncated, null byte, wrong-type per required field)
│   │   └── config-property.test.ts             # Cluster T: fast-check property tests (round-trip, strict rejection, mergeWithDefaults invariance)
│   ├── regression/                             # Cluster V: bug-bash regression suite (≥ 10 entries, each protecting a historical PR/F-ID)
│   │   ├── README.md                           # Directory contract + how to add a new entry
│   │   ├── pr-117-config-safe-parse.test.ts    # F-037 — init safeParse on malformed config
│   │   ├── pr-130-community-registry-hardening.test.ts  # F-094/097/102/103/116 — safe paths, semver, typed error
│   │   ├── pr-130-registry-schema-strict.test.ts        # Cluster A — kigumiConfigSchema.strict()
│   │   ├── pr-134-aliases-removal.test.ts      # F-064 — aliases dropped, toKigumiAlias substitute
│   │   ├── pr-95-init-preservation-length.test.ts       # Record vs array .length on installedComponents
│   │   ├── pr-126-react-ref-typing.test.ts     # F-072 — useRef<Wa* | null> + useCallback setter
│   │   ├── f-068-vue-boolean-prop-filter.test.ts        # Vue hostAttributes strips false (else attrs stick)
│   │   ├── f-013-palette-tier-gating.test.ts   # Free tier rejects Pro palettes (B3 bug-injection mirror)
│   │   ├── resolve-components-tolowercase.test.ts       # Multi-word components survive kebab/Pascal
│   │   └── f-058-config-monorepo-isolation.test.ts      # loadConfig stopDir: cwd, no parent inheritance
│   ├── _helpers/                               # Shared test helpers (see Test Helpers below); not test files
│   │   ├── consumer-lint.ts                    # CONSUMER_BASELINE (`@eslint/js` + typescript-eslint `recommended`, unmodified), the one `consumerESLint` instance, SETUP_DEPENDENT_RULES (`no-undef`) and lintAsConsumer(): lint generated source as a consumer would (issue #136)
│   │   ├── angular-omitted-inputs.ts           # ANGULAR_OMITTED_INPUTS / ANGULAR_INHERITED_OMISSIONS: the CEM attributes each Angular Template has no @Input() for, pinned as committed data independent of validate:cem-sync's allowlists
│   │   ├── deprecation-readers.ts              # How each surface states a deprecation: readPropDeprecations() via TypeScript's own JSDoc parser (interface member, class property, defineProps key; SFCs via Vue's parser), plus the `.jsx` typedef and story argType text readers
│   │   ├── deprecated-props-fixture.ts         # DEPRECATED_PROPS / DEPRECATION_MESSAGES: the plain and kebab-case deprecated props every deprecation test generates from
│   │   ├── registry-coverage.ts                # describeRegistryCoverage(): the fail-closed metadata and eventless/methodless pin checks, registered by all three registry loops
│   │   ├── enumerated-boolean-attributes.ts    # ENUMERATED_BOOLEAN_ATTRIBUTES: boolean CEM attributes Web Awesome reads by keyword, not presence (`spellcheck` true/false, `autocorrect` on/off); the harness expects these keywords for true and false
│   │   ├── vue-model-attributes.ts             # VUE_MODEL_ATTRIBUTE: the Vue Templates that expose a `v-model` and the CEM attribute each model carries, pinned data shared by the Vue registry harness and template-registry-props.test.ts
│   │   ├── eventless-components.ts             # EVENTLESS_COMPONENTS: registry components with no CEM events, pinned data shared by the React, Vue and Angular registry harnesses
│   │   ├── methodless-components.ts            # METHODLESS_COMPONENTS: registry components with no public CEM methods, pinned data shared by the React, Vue and Angular registry harnesses
│   │   └── wa-component-stub.ts                # Stub every `@awesome.me/webawesome(-pro)/dist/components/**` import resolves to, aliased from both vitest configs via vitest.wa-stub-alias.ts
│   └── _setup/
│       └── fast-check.ts                        # Cluster T: fast-check global config (pinned seed=1; FC_SEED env override)
├── _helpers/
│   └── free-tier-env.ts     # FREE_TIER_ENV: blanks both token sources, so a global Pro token cannot move an integration or e2e suite onto Pro
├── integration/             # Integration tests (build + run CLI)
│   └── *.test.ts            # Tests that require built CLI
├── e2e/                     # Full CLI integration
│   ├── smoke.test.ts            # End-to-end workflows
│   ├── init-source-layout.test.ts # `init` across all 4 framework/layout combos (issue #48)
│   ├── consumer-tsc-react.test.ts   # Free and Pro: Vite-React init + add --all + strict `tsc -b` (issues #73, #79), then the same add-output under the Next ambient declaration (issue #78)
│   ├── consumer-tsc-vue.test.ts     # Free and Pro: create-vite vue-ts init + add --all + `vue-tsc -b` (issues #78, #79)
│   ├── consumer-tsc-angular.test.ts # Free and Pro: `ng new` init + add --all + `ngc` with strictTemplates (issues #78, #79)
│   ├── _helpers/
│   │   ├── consumer.ts              # describeConsumers(): the four checks every consumer suite shares, registered once per tier (KIGUMI_CONSUMER_TIER narrows it to one)
│   │   └── consumer-premise.ts      # resolveProPackage() + probeProPackage(): can this machine install the pinned Pro package; consumerPremise(): run, skip or fail; reportNotRun(): settles it (docs/adr/0003)
│   └── starter-snapshots.test.ts # Byte-level diff of `kigumi add` output against frozen fixtures, and no fixture without an emitted file (env-gated; see Cluster R)
├── fixtures/                # Frozen golden output for regression tests
│   ├── migration/               # Pre-0.20 config shapes for migration tests
│   └── starter-snapshots/{react,vue,angular,next}/  # Per-starter `kigumi add` output (regen via `pnpm update:starter-snapshots`)
└── .tmp-e2e-*/              # Temporary test projects (gitignored; see E2E Test Projects)
```

## Commands

```bash
pnpm test              # Unit tests (fast)
pnpm test:integration  # Integration tests (requires build first)
pnpm test:e2e          # E2E tests (slow, creates real projects)
pnpm test:starters     # Snapshot diff against a real starter (env-gated; KIGUMI_STARTER + KIGUMI_STARTER_DIR required)
pnpm test:stories      # Storybook play() interactions (browser-mode vitest in docs/)
pnpm test:coverage     # Unit tests with coverage report
pnpm test:mutation     # Mutation testing via Stryker (cluster V; weekly cron + manual)
pnpm test:mutation:incremental  # Stryker incremental mode (skip already-tested mutants)
pnpm test:all          # Build + unit + integration + e2e + stories (sequential, fail-fast)
pnpm test:watch        # Watch mode
```

`pnpm test:all` (and `pnpm test:stories`) require Chromium for the storybook lane; install once with `cd docs && pnpm exec playwright install chromium`.

`pnpm test:mutation` is documented in detail in the [Mutation testing](#mutation-testing-pnpm-testmutation) section below.

---

## Type-Checking Tests

`tests/**` is included in `tsconfig.tests.json` and gated by `pnpm check:tests`. The script runs `tsc --noEmit -p tsconfig.tests.json` and fails CI on any error. The function harness renders committed React and Vue Templates, so this tsconfig sets `jsx` and the DOM lib and includes the CSS and React JSX shims. Angular Templates are imported by computed path, so `tsc` does not follow them here: their decorators need `experimentalDecorators`, which only `templates/angular/tsconfig.json` (`pnpm typecheck:templates`) sets. For the same reason the Angular adapter's inline test components use `Component({...})(class ...)` instead of decorator syntax: Vite compiles test files under the root tsconfig, and esbuild would emit standard decorators. The historical baseline at `tests/.tsc-baseline.json` was retired in PR #137 once the existing 133 errors were fixed; the gate is now strict.

```bash
pnpm check:tests                       # gate; fails on any tests/ type error
pnpm check:tests --update-baseline     # re-create the baseline (only if a deliberate
                                       # batch of new errors needs allowlisting)
```

### When `tsc` upgrades introduce new error codes

A TypeScript minor bump can flag previously-silent issues. Fix the new errors in the upgrade PR. Re-introducing the baseline file is a last resort and should be paired with a follow-up plan to drain it.

---

## Test Helpers (`tests/unit/_helpers/`)

Sibling modules shared across unit tests. Prefer these over per-file `vi.mock` factories (cluster S).

| Helper | Use when |
| --- | --- |
| `createTestOutput()` (from `_helpers/output.ts`) | You only need a satisfies-the-interface output that records via `vi.fn()` and lets you assert with `vi.mocked(output.success).toHaveBeenCalledWith(...)`. The 4 init-family tests still use this shape. |
| `createRecordingOutput()` (from `_helpers/output.ts`) | You want a `RecordingOutput` with a typed `calls` array. Assert via `expect(output.calls).toContainEqual({ method: 'note', args: ['Settings', expect.stringContaining('awesome')] })`. Pair with `setOutputForTesting(output)`. |
| `createTestPrompts(scripts)` (from `_helpers/prompts.ts`) | You need a scripted `PromptsAdapter`. Pass arrays for `confirm`, `select`, `text`, `multiselect`; the adapter dispenses them in order. Throws "Unexpected prompt" when a script is exhausted or an unconfigured method is called, so missing setup fails loud. Pair with `setPromptsForTesting(prompts)`. Set `cancelSymbol` to drive the cancellation path through `isCancel()`. |
| `writeTierFixture(dir, 'free' \| 'pro')` (from `_helpers/tier.ts`) | You need `detectTier()` to read a real `package.json` instead of mocking `src/utils/tier.js`. Call after `mkdtemp` + `chdir(testDir)`; production code reads the dependencies map and returns the requested tier. |
| `createTestKigumiConfig(overrides)` (from `_helpers/kigumi-config.ts`) | You need a fully-typed `KigumiConfig` for `parseKigumiConfig()` callers. |
| `createTestAddOptions(overrides)` (from `_helpers/add-options.ts`) | You need a fully-typed `AddOptions` for command tests. |
| `registerTestSeams(output, prompts)` / `clearTestSeams()` (from `_helpers/seams.ts`) | You're wiring both the output and prompts seams in the same test file. Call `registerTestSeams` after `vi.resetModules()` in `beforeEach`, and `clearTestSeams` in `afterEach`. Wraps the dynamic-import dance below. |
| `WebAwesomeComponentStub` (default export of `_helpers/wa-component-stub.ts`) | You don't import it: both vitest configs alias every `@awesome.me/webawesome(-pro)/dist/components/**` deep-import to it (via `vitest.wa-stub-alias.ts`), so a Template's dynamic component import resolves without loading Web Awesome's runtime. Pro isn't installed at all, and Free's runtime is dead weight for a contract proof. It registers nothing, keeping the harness's `customElements.get(tagName)` assertion meaningful. |
| `METHODLESS_COMPONENTS` / `EVENTLESS_COMPONENTS` (from `_helpers/methodless-components.ts` / `_helpers/eventless-components.ts`) | A registry harness needs to know which components may legitimately prove zero methods / events. Committed data, never derived from `COMPONENT_METADATA`: `describeRegistryCoverage()` (`_helpers/registry-coverage.ts`, registered by every registry loop) pins both directions, so a WA bump that adds or removes a method or event must edit the list in the same commit. |
| `isolatedGitEnv(extra)` (from `_helpers/git-env.ts`) | A test spawns git against a temporary repo. Pass it as the child's `env`: it drops every `GIT_*` variable, because git exports `GIT_INDEX_FILE` to hooks and lint-staged runs `vitest related` in the pre-commit hook, so an inherited environment makes `git add` write the real repository's index (issue #150). |
| `stripGitEnv()` (from `_helpers/git-env.ts`) | The code under test spawns git itself, with `process.env`. Call it in `beforeEach` and its restore function in `afterEach`: `isolatedGitEnv()` cannot reach those calls, and inside the pre-commit hook a `git fetch` or `update-ref` would follow the hook's `GIT_*` variables to the real repository (issue #150). |

The DI hooks live on the production modules. Prefer `registerTestSeams` / `clearTestSeams` from `_helpers/seams.ts` so the dynamic-import boilerplate stays in one place:

```typescript
// In beforeEach (after vi.resetModules()):
await registerTestSeams(
  createRecordingOutput(),
  createTestPrompts({ select: ['react'] })
);

// In afterEach:
await clearTestSeams();
```

Direct seam access is still available when only one of the two seams is needed (e.g. `setOutputForTesting` alone):

```typescript
const outMod = await import('../../src/output/index.js');
outMod.setOutputForTesting(createRecordingOutput());
// ...
(await import('../../src/output/index.js')).resetOutputForTesting();
```

The dynamic imports are required because the registered instance lives in module-level state, and `vi.resetModules()` evicts the module so the next import re-evaluates with fresh state - register the test instance after the reset, before the production command's dynamic import.

For other module-level seams (`regenerate`, `github-fetcher`, `github-token`, `registry-resolver`, `version-map`, `template`, `registry`), prefer `vi.spyOn(module, 'fn').mockResolvedValue(...)` per-test inside the beforeEach or test body. `vi.spyOn` does not match the `vi\.mock` substring used by the budget gate (see below) and preserves the rest of the module's real behavior.

## Mock Budget (`pnpm check:mocks`)

`scripts/check-mock-budget.ts` walks `tests/unit/`, counts `vi.mock` substring matches, and gates against:

- **Total**: < 50 across `tests/unit/` (currently 16; cluster S PR-S4 closed out the initiative).
- **Per-file**: `theme-commands.test.ts` < 10 (currently 0).

Modes:

```bash
pnpm check:mocks                        # advisory; prints counts, exits 0
MOCK_BUDGET_ENFORCE=1 pnpm check:mocks  # enforced; exits 1 on threshold breach
```

CI runs the gate in enforce mode (`MOCK_BUDGET_ENFORCE=1` set in the `Check mock budget` step in `.github/workflows/ci.yml`); the local stop-hook stays advisory and runs alongside `check:tests` on the test-only fast path.

### Legitimate exceptions to `vi.mock`

The cluster S target leaves room for ~30 mocks. These are the documented exceptions:

- **`execa` / `node:child_process`**: tests that must not actually shell out (subprocess boundaries are fine to mock; spawning a real binary in unit tests is the smell).
- **Third-party SDKs without a kigumi wrapper**: when no internal seam exists yet. Add the seam in a follow-up if the same SDK gets mocked in three or more places.

`@clack/prompts` is **not** an exception once the wrapper migration is complete. New tests must register a `setPromptsForTesting()` adapter instead.

---

## Negative-Path Inventory

Every user-facing command must have at least three negative-path tests (invalid input, missing dependency, failed pre-flight, surfaced error). The table below tracks current coverage; reviewers extending a command must add or update a row when introducing a new failure mode.

Cluster T (PR-T3) ships this section. New tests added in cluster T are noted as `[T1]` (property tests), `[T2]` (corrupt-config), and `[T3]` (concurrency / failure-modes).

| Command | Scenario | Expected Surface | Test File | Test Name (substring) |
| --- | --- | --- | --- | --- |
| `init` | unsupported framework | `ConfigInvalidError` | `tests/unit/options-schema.test.ts` | `rejects invalid framework` |
| `init` | unknown top-level config key (e.g. `framwork`) | `ConfigInvalidError` | `tests/unit/schemas/config-property.test.ts` [T1] | `rejects an arbitrary unknown top-level key on kigumiConfigSchema` |
| `init` | `--yes` mode with missing required arg | `ValidationError` | `tests/unit/options-schema.test.ts` | `throws formatted error on invalid input` |
| `init` | user cancels prompt mid-flow | `UserCancelledError` | `tests/unit/init-validate-and-prepare.test.ts` | `throws UserCancelledError when the user picks "cancel"` |
| `init` | missing `package.json` | `PreFlightCheckError` | `tests/unit/init-validate-and-prepare.test.ts` | `rejects with PreFlightCheckError when package.json is missing` |
| `init` | unreadable `package.json` (a directory) | `PackageJsonReadError`, exit 4 | `tests/unit/package-json-read-error.test.ts` | `kigumi init reports a directory at package.json` |
| `init` | invalid JSON in `package.json` | `PackageJsonInvalidError`, exit 4 | `tests/unit/package-json-read-error.test.ts` | `kigumi init renders the full error and fix for invalid JSON in package.json` |
| `add` | no config present | error output (no throw) | `tests/unit/add-command.test.ts` | `should fail without config file` |
| `add` | malformed config JSON | `ConfigInvalidError` | `tests/unit/add-command.test.ts` | `should fail with invalid config (completely broken JSON)` |
| `add` | typo'd config key | `ConfigInvalidError` | `tests/unit/add-command.test.ts` | `surfaces ConfigInvalidError instead of the generic post-check fallback` |
| `add` | invalid component name | error output | `tests/unit/add-command.test.ts` | `should handle invalid component names` |
| `add` | GitHub fetcher 401 / 403 | `Error` "Authentication failed" | `tests/unit/failure-modes.test.ts` [T3] | `fetchFile throws on 403 with "Authentication failed"` |
| `add` | GitHub fetcher 429 | `Error` with status code | `tests/unit/failure-modes.test.ts` [T3] | `fetchFile throws on 429 with the status code in the message` |
| `add` | network unreachable (ECONNREFUSED) | `TypeError` | `tests/unit/failure-modes.test.ts` [T3] | `fetchFile rethrows a TypeError when fetch rejects with ECONNREFUSED` |
| `update` | no config present | `output.error` call | `tests/unit/update-command.test.ts` | `should call output.error when no config is found` |
| `update` | empty `componentsDir` | "no installed components" | `tests/unit/update-command.test.ts` | `should report no installed components when componentsDir is empty` |
| `update` | snapshot/template merge conflict | conflict markers written | `tests/unit/update-command.test.ts` | `should write conflict markers when changes overlap` |
| `upgrade` | no config file | `output.error` + exit | `tests/unit/upgrade-command.test.ts` | `should error when no config file exists` |
| `upgrade` | typo'd config key | hint + non-zero exit | `tests/unit/upgrade-command.test.ts` | `prepends a friendly hint and exits non-zero on typo configs` |
| `upgrade` | unreadable `package.json` (a directory) | `PackageJsonReadError`, exit 4, config unchanged | `tests/unit/package-json-read-error.test.ts` | `kigumi upgrade reports a directory at package.json` |
| `upgrade` | dependency install fails | `DependencyInstallError`, exit 5, config keeps the old version | `tests/unit/upgrade-command.test.ts` | `keeps the old version in kigumi.config.json when the install fails` |
| `diff` | no config present | `output.error` call | `tests/unit/diff-command.test.ts` | `should call output.error when no config is found` |
| `diff` | empty `componentsDir` | "no installed components" | `tests/unit/diff-command.test.ts` | `should report no installed components when componentsDir is empty` |
| `diff` | non-existent `componentsDir` | "no installed components" | `tests/unit/diff-command.test.ts` | `should report no installed components when componentsDir does not exist` |
| `diff` | unreadable `package.json` (a directory) | `PackageJsonReadError`, exit 4, not "missing" files | `tests/unit/package-json-read-error.test.ts` | `kigumi diff reports a directory at package.json instead of missing files` |
| `theme set` | no config file | error | `tests/unit/theme-commands.test.ts` | `should fail without config file` |
| `theme set` | pro theme on free tier | `ProThemeRequiredError` | `tests/unit/theme-commands.test.ts` | `should reject pro theme on free tier with ProThemeRequiredError` |
| `theme set` | typo'd config key | `ConfigInvalidError` | `tests/unit/config-error-surface.test.ts` | `theme command surfaces ConfigInvalidError on typo config` |
| `theme set` | user cancellation | `UserCancelledError` | `tests/unit/theme-commands.test.ts` | `should handle user cancellation` |
| `theme set` | unreadable `package.json` (a directory) | `PackageJsonReadError`, exit 4, config unchanged | `tests/unit/package-json-read-error.test.ts` | `kigumi theme set reports a directory at package.json and saves nothing` |
| `theme show` | no config file | error | `tests/unit/theme-commands.test.ts` | `should fail without config file` (in `show` describe) |
| `theme show` | pro theme on free tier | `ProThemeRequiredError` | `tests/unit/theme-commands.test.ts` | `should reject pro theme on free tier` |
| `theme show` | malformed config | `ConfigInvalidError` | `tests/unit/config-error-surface.test.ts` | `theme command surfaces ConfigInvalidError on typo config` |
| `theme install` | no config file | error | `tests/unit/theme-commands.test.ts` | `should fail without config file` (in `install` describe) |
| `theme install` | invalid theme name | error output | `tests/unit/theme-commands.test.ts` | `should fail when theme not found in registry` |
| `theme install` | typo'd config key | `ConfigInvalidError` | `tests/unit/config-error-surface.test.ts` | `theme command surfaces ConfigInvalidError on typo config` |
| `theme install` | unreadable `package.json` (a directory) | `PackageJsonReadError`, exit 4, nothing written | `tests/unit/package-json-read-error.test.ts` | `kigumi theme install reports a directory at package.json and writes nothing` |
| `theme install` | a theme file cannot be fetched | non-zero exit, nothing written | `tests/unit/theme-install-local-source.test.ts` | `writes nothing when one of the theme files cannot be fetched` |
| `palette` | no config file | error | `tests/unit/palette-command.test.ts` | `should fail without config file` |
| `palette` | invalid palette name | exits non-zero | `tests/unit/palette-command.test.ts` | `should reject invalid palette name and call process.exit` |
| `palette` | pro palette on free tier | `ProThemeRequiredError` | `tests/unit/palette-command.test.ts` | `should reject pro palettes on free tier` |
| `palette` | typo'd config key | `ConfigInvalidError` | `tests/unit/config-error-surface.test.ts` | `palette command surfaces ConfigInvalidError on typo config` |
| `palette` | unreadable `package.json` (a directory) | `PackageJsonReadError`, exit 4, config unchanged | `tests/unit/package-json-read-error.test.ts` | `kigumi palette reports a directory at package.json and saves nothing` |
| `brand` | no config file | error | `tests/unit/brand-command.test.ts` | `should fail without config file` |
| `brand` | invalid brand color | exits non-zero | `tests/unit/brand-command.test.ts` | `should reject invalid brand color and call process.exit` |
| `brand` | typo'd config key | `ConfigInvalidError` | `tests/unit/config-error-surface.test.ts` | `brand command surfaces ConfigInvalidError on typo config` |
| `brand` | user cancellation | `UserCancelledError` | `tests/unit/brand-command.test.ts` | `should handle user cancellation` |
| `brand` | unreadable `package.json` (a directory) | `PackageJsonReadError`, exit 4, config unchanged | `tests/unit/package-json-read-error.test.ts` | `kigumi brand reports a directory at package.json and saves nothing` |
| `status` | no config file | thrown error | `tests/unit/status.test.ts` | `should throw error when config not found` |
| `status` | tier mismatch (pro package without token) | warning | `tests/unit/status.test.ts` | `should warn about tier mismatch (pro package without token)` |
| `status` | duplicate WA packages installed | warning | `tests/unit/status.test.ts` | `should warn about duplicate packages` |
| `status` | missing components directory | graceful handling | `tests/unit/status.test.ts` | `should handle missing components directory gracefully` |
| `list` | `package.json` is a directory | `PackageJsonReadError`, exit 4 | `tests/unit/package-json-read-error.test.ts` | `kigumi list renders the full error and fix for a directory at package.json` |
| `list` | `package.json` not readable (EACCES) | `PackageJsonReadError`, exit 4 | `tests/unit/package-json-read-error.test.ts` | `kigumi list renders the full error and permissions fix for an unreadable package.json` |
| `registry init` | existing `registry.json` | warn (do not overwrite) | `tests/unit/registry-init-command.test.ts` | `should warn if registry.json already exists` |
| `registry init` | user provides bad arg | exits with error | `tests/unit/registry-init-command.test.ts` | (see scaffold negative-path describes) |
| `registry init` | user cancellation | `UserCancelledError` | `tests/unit/registry-init-command.test.ts` | (interactive-prompts describe) |
| `registry validate` | missing `registry.json` | failure | `tests/unit/registry-validate-command.test.ts` | `should fail when registry.json does not exist` |
| `registry validate` | invalid JSON | failure | `tests/unit/registry-validate-command.test.ts` | `should fail on invalid JSON` |
| `registry validate` | invalid Zod schema | failure | `tests/unit/registry-validate-command.test.ts` | `should fail on invalid schema` |
| `registry validate` | missing referenced files | failure | `tests/unit/registry-validate-command.test.ts` | `should detect missing referenced files` |
| `registry validate` | wrong file extension for framework | failure | `tests/unit/registry-validate-command.test.ts` | `should detect wrong file extensions for framework` |
| `registry connect` | foreign-framework registry | warn (proceed) | `tests/unit/registry-connect-command.test.ts` | `warns (does not throw) when connecting a foreign-framework registry` |
| `registry connect` | duplicate connection | no-op | `tests/unit/registry-connect-command.test.ts` | `does not duplicate when the same local registry is connected twice` |
| `registry connect` | typo'd config key | `ConfigInvalidError` | `tests/unit/config-error-surface.test.ts` | `registry list-sources action surfaces ConfigInvalidError on typo config` |
| `registry list` | no registries configured | message + zero exit | `tests/unit/registry-list-remove-command.test.ts` | `should show message when no registries configured` |
| `registry list` | missing config file | non-zero exit | `tests/unit/registry-list-remove-command.test.ts` | `should exit with error code when config is missing` |
| `registry list` | typo'd config key | `ConfigInvalidError` | `tests/unit/config-error-surface.test.ts` | `registry list-sources action surfaces ConfigInvalidError on typo config` |
| `registry remove` | unknown registry URL/name | warn | `tests/unit/registry-list-remove-command.test.ts` | `should warn when registry not found` |
| `registry remove` | components depend on it | warn about affected components | `tests/unit/registry-list-remove-command.test.ts` | `should warn about affected components when removing registry` |
| `registry remove` | missing config file | non-zero exit | `tests/unit/registry-list-remove-command.test.ts` | `should exit with error code when config is missing` |
| `registry add-component` | missing `registry.json` | no-op | `tests/unit/registry-add-component.test.ts` | `returns without writing when registry.json is missing` |
| `registry add-component` | invalid `registry.json` | no-op | `tests/unit/registry-add-component.test.ts` | `returns without writing when registry.json fails Zod parse` |
| `registry add-component` | duplicate slug | rejection | `tests/unit/registry-add-component.test.ts` | `rejects duplicate slug via the slug prompt validate function` |
| `registry add-component` | user cancellation | `UserCancelledError` | `tests/unit/registry-add-component.test.ts` | `aborts via UserCancelledError when the user cancels mid-flow` |
| `registry add-theme` | missing `registry.json` | no-op | `tests/unit/registry-add-theme.test.ts` | `returns without writing when registry.json is missing` |
| `registry add-theme` | invalid `registry.json` | no-op | `tests/unit/registry-add-theme.test.ts` | `returns without writing when registry.json fails Zod parse` |
| `registry add-theme` | duplicate / non-kebab / empty slug | rejection | `tests/unit/registry-add-theme.test.ts` | `rejects duplicate slug, non-kebab-case, and empty via slug prompt validate` |

### Cross-cutting infrastructure (covers many commands)

| Surface | Scenario | Expected Behavior | Test File | Test Name (substring) |
| --- | --- | --- | --- | --- |
| `loadConfig` / `getConfig` | BOM-prefixed JSON | throws via cosmiconfig | `tests/unit/schemas/config-corrupt.test.ts` [T2] | `throws when kigumi.config.json starts with a UTF-8 BOM` |
| `loadConfig` / `getConfig` | trailing-comma JSON | throws | `tests/unit/schemas/config-corrupt.test.ts` [T2] | `throws when JSON has a trailing comma` |
| `loadConfig` / `getConfig` | truncated mid-write | throws | `tests/unit/schemas/config-corrupt.test.ts` [T2] | `throws when the config file was truncated` |
| `loadConfig` / `getConfig` | wrong type per required field | `ConfigInvalidError` | `tests/unit/schemas/config-corrupt.test.ts` [T2] | `rejects $field set to a wrong-type value via ConfigInvalidError` |
| `saveConfig` | concurrent disjoint patches (race) | at-least-one-fulfils | `tests/unit/concurrency.test.ts` [T3] | `leaves disk in a valid JSON state and at least one patch fulfils` |
| `saveConfig` | mid-write `loadConfig` race | `ConfigNotFoundError` on B | `tests/unit/concurrency.test.ts` [T3] | `exposes the load-modify-write race` |
| `saveConfig` | `fs.writeJson` rejects (ENOSPC / EACCES) | propagates with code | `tests/unit/failure-modes.test.ts` [T3] | `saveConfig propagates ENOSPC ... with code preserved` |

---

## Regression suite (`tests/unit/regression/`)

Cluster V (F-X11) bug-bash arm. Each test in this directory protects against a specific historical bug that real users hit and the project later fixed. Mutation testing (next section) measures _whether_ tests catch generic breakage; this directory provides documented evidence that the suite catches the specific breakage on file.

**Where it lives.** The cluster-V spec writes the path as `tests/regression/`. Execution placed it under `tests/unit/regression/` so the existing positional `pnpm test tests/unit` glob, the `tests/unit/`-scoped `pnpm check:mocks` budget, the `tsconfig.tests.json` baseline, and `.lintstagedrc.json`'s `vitest related` gate all cover these tests automatically. `tests/regression/` remains an option for a future move; the rename is mechanical.

**File-header contract.** Every test opens with:

```ts
/**
 * Protects: PR #117 (F-037)
 * Bug: <one-line user-visible symptom>
 * Fix: <commit-SHA-of-original-fix> — <one-line summary>
 */
```

The `describe()` block name should match the protected PR/F-ID.

**Adding a new entry.** Pick a bug from a closed GitHub issue or a recent merged PR that (a) was user-visible, (b) had a non-trivial fix, (c) covers a structural area the rest of the suite touches. Write a test that asserts the invariant the fix established. Verify on a scratch branch:

```bash
git checkout -b scratch/regression-verify-<id> main
git revert <fix-merge-sha> --mainline 1
pnpm test tests/unit/regression/<your-file>
# must fail
git checkout main && git branch -D scratch/regression-verify-<id>
```

If `git revert` is impossible (later refactors renamed files), assert the logical invariant instead and note "revert verification by manual code rollback" in the file header.

See `tests/unit/regression/README.md` for the full contract.

## Mutation testing (`pnpm test:mutation`)

Cluster V (F-X10). [StrykerJS](https://stryker-mutator.io/) mutates a declared subset of `src/**` and runs the unit suite per mutant. The percentage of mutants killed by _any_ test = the mutation score. The break threshold is **80 %**; below that the run fails.

Run locally with `pnpm test:mutation`. Output: `reports/mutation/mutation.html` (gitignored). The CI workflow at `.github/workflows/mutation.yml` runs weekly (Sun 02:00 UTC) plus on manual `workflow_dispatch`, with a 30-day artifact retention.

V1 baseline scope: `src/utils/tier.ts` only. The first two scheduled runs scored 73.33 % and failed the 80 % break threshold; the gaps were an unparsed `tierSchema`, the free package not asserted against a Pro token, and non-JSON `package.json` read failures swallowed by a catch-all. Those are covered now (100 % kill rate on `tier.ts`). Wider scopes hit two upstream blockers and are tracked as follow-up: see `stryker.conf.mjs` for the full investigation. The mutate list is intentionally a literal array of paths so future PRs widen it explicitly.

**Why `coverageAnalysis: 'all'`** instead of the spec's `'perTest'` preference: the patched `@stryker-mutator/vitest-runner@9.6.1` plus vitest 4.x hangs the `perTest` dry run on this codebase regardless of mutate scope. `'all'` is functionally equivalent for the score (it runs all tests per mutant; the kill criterion is the same).

**Why `disableTypeChecks: 'src/**/\*.ts'`** is on: Stryker's mutators intentionally introduce type errors; treating them as failures would pollute the score. Type safety is enforced separately by `pnpm type-check`and`pnpm check:tests` (Cluster Q1's tests baseline).

**Why the upstream `@stryker-mutator/vitest-runner` is patched** (see `patches/`): vitest 4.x's threads pool forbids `process.chdir()`, which 5 legacy unit tests rely on. The runner hardcodes `pool: 'threads'`. The patch switches it to `pool: 'forks'` (singleFork) so all tests run.

---

## Local Pre-Commit Signal

`.husky/pre-commit` runs `pnpm lint-staged && pnpm type-check` on every commit. The lint-staged config at `.lintstagedrc.json` scopes test execution narrowly:

- `src/**/*.{ts,tsx}` and `tests/unit/**/*.{ts,tsx}`: eslint, prettier, and `vitest related --run` (runs only the unit tests that import the staged files).
- `tests/integration/**`, `tests/e2e/**`, `scripts/**`: eslint and prettier only. Integration and e2e suites are CI-only; firing them on commit would block for minutes.
- Other globs (json/md/vue/css/etc.): prettier-only formatting.

Typical commit overhead is 5 to 30 seconds depending on how many unit tests the staged files transitively touch. Failures block the commit; fix the failing test or back out the change before retrying.

```bash
HUSKY=0 git commit -m '...'    # emergency escape hatch; skips both halves
```

Use the escape hatch only for branch-state operations (rebase fixups, WIP snapshots) where running tests would be premature. CI re-runs lint, type-check, and the full unit suite on every PR, so escaped commits get caught at push.

`vitest related` uses the root `vitest.config.ts`, which includes only `tests/unit/**`. The e2e suite has its own `vitest.e2e.config.ts` (used by `pnpm test:e2e`); integration uses `vitest.integration.config.ts`. Neither fires from the pre-commit hook.

---

## Test Types

### Unit Tests (`tests/unit/`)

Fast, isolated tests for utilities and business logic.

```typescript
import { describe, it, expect } from 'vitest';
import { detectTier } from '@/utils/tier';

describe('detectTier', () => {
  it('returns free when no .env exists', async () => {
    const tier = await detectTier('/nonexistent');
    expect(tier).toBe('free');
  });
});
```

**What to unit test:**

- Pure functions
- Utility helpers
- Zod schema validation
- Tier detection logic
- Config parsing
- Command handlers (diff, upgrade, doctor, theme, brand, palette)
- File regeneration (kigumi.ts, layers.css, theme.css)
- Community registry schema validation
- GitHub URL parsing and token resolution
- Registry caching (disk cache TTL, invalidation)
- Dependency resolution (topological sort, circular detection)

### E2E Tests (`tests/e2e/`)

Full CLI integration tests that create real projects.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';

describe('smoke test', () => {
  const testDir = 'tests/.tmp-smoke';

  beforeAll(async () => {
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  it('initializes a React project', async () => {
    const result = await execa(
      'node',
      [
        'dist/index.js',
        'init',
        '--framework=react',
        '--theme=awesome',
        '--yes',
      ],
      { cwd: testDir }
    );

    expect(result.exitCode).toBe(0);
    expect(await fs.pathExists(`${testDir}/kigumi.config.json`)).toBe(true);
  });
});
```

#### Consumer tsc (`consumer-tsc-*.test.ts`)

The types seam of `docs/adr/0004`: each suite scaffolds a project with the framework's own tool, runs the real CLI (`init`, then `add --all`), and typechecks it with that project's own compiler. `describeConsumers()` in `tests/e2e/_helpers/consumer.ts` registers the same four checks for every framework, once for a Free and once for a Pro consumer, each on its own project: the tier's package at `DEFAULT_WEBAWESOME_VERSION` and the other tier's package in neither `package.json` nor `node_modules` (so a Template importing the wrong path cannot resolve), the tier's Templates (Free drops the Pro-only ones, Pro installs every one), a clean typecheck, and a planted strict-only error (`take(null)`, TS2345) reported as the compiler's own output. `add --all` is the only tier filter; the suites compare what landed with the registry. Every plant goes into the components directory beside the Templates (`withPlanted()`), so a rejected plant also shows that directory is in the compiled program; a clean typecheck alone would pass with the Templates excluded. `expectRejected()` is the one assertion for a plant: non-zero exit, the plant's path and each diagnostic in the output, and a message naming the command and the file when the compiler exits 0. A new framework supplies a `ConsumerSpec` rather than copying the checks, and gets both tiers.

**The Pro consumer needs the pinned Pro package.** `resolveProPackage()` reports whether this machine can install it the way the consumer's `init` will: a token `init` finds (`detectProTokenSync` on the consumer's own directory, which reads `WEBAWESOME_NPM_TOKEN`, then `~/.npmrc`, then that directory's `.env`, which a fresh scaffold does not have), and a registry that serves the package with this machine's auth (`probeProPackage()`, an `npm view` of the pinned version against the Pro registry). npm and pnpm authenticate that registry only from the `~/.npmrc` `_authToken` line, never from `WEBAWESOME_NPM_TOKEN` (#160), so a machine with only the variable fails the probe instead of the install. `consumerPremise()` turns an unusable package into skipped (`NOT verified`, where `skipPermitted()` allows it: outside CI, or with `KIGUMI_FRESHNESS_ALLOW_SKIP=1`) or failed (`could not run`, everywhere else), in the `summarizeGuard()` wording of `docs/adr/0003`. `describeConsumer()` then registers a single `has the Pro package to typecheck against` test, which `reportNotRun()` settles as that skip or failure. The `installs the pinned Pro Web Awesome package only` check, not the typecheck, is what catches a "Pro" consumer that installed Free: its typecheck passes.

**CI scopes the token to the Pro consumers.** `KIGUMI_CONSUMER_TIER` (`free` or `pro`) narrows `describeConsumers()` to one tier; unset, both register. The `e2e` job first runs every suite with `KIGUMI_CONSUMER_TIER=free` and no token on the runner, then writes the `~/.npmrc` auth line (only when the `WEBAWESOME_NPM_TOKEN` secret exists), then runs `tests/e2e/consumer-tsc-*` with `KIGUMI_CONSUMER_TIER=pro` and `npm_config_ignore_scripts=true`, so no dependency's install script runs while the token is on disk. `KIGUMI_FRESHNESS_ALLOW_SKIP` is set only on runs that receive no secrets (fork and Dependabot pull requests); a same-repo pull request without the token fails. `ci-e2e-pro-step.test.ts` executes that decision and pins the step order. Every other integration and e2e suite spreads `FREE_TIER_ENV` (`tests/_helpers/free-tier-env.ts`) into the CLI's environment, so a developer's global token does not move it onto Pro either.

| Framework | Scaffold | Typecheck |
| --- | --- | --- |
| React | `pnpm create vite@CREATE_VITE_VERSION` | `tsc -b`, `strict` turned on first |
| Vue | `pnpm create vite@CREATE_VITE_VERSION` | `vue-tsc -b` |
| Angular | `pnpm dlx @angular/cli@ANGULAR_CLI_VERSION` | `ngc -p tsconfig.app.json --noEmit` |

- **Angular runs `ngc`, not `tsc`.** A Template's markup is a string only the Angular compiler reads: plain `tsc` passed a Template carrying `[attr.once]` (NG5002), and it passes the planted error too, which sits in a component template for that reason. `ngc` colours its output even when piped and ignores `--pretty false`, so `commandText()` strips ANSI codes.
- **The Next pass** typechecks the React add-output a second time with `web-awesome.d.ts` (written by `generateNextEnvDts`, the function `init` calls for Next) in place of `vite-env.d.ts`, and `types: []`, so no `vite/client`. Only the components directory is included: the Vite scaffold's own `App.tsx` imports an SVG. One line stands in for Next's own `declare module '*.css' {}`, which TypeScript 6 needs for every Template's side-effect CSS import. A planted `import.meta.env` passes the Vite pass and fails the Next one, which is what shows `vite/client` is out of scope, and the strict-only plant fails it too, since the Next pass inherits `strict` rather than setting it. No Next install, no Next build, no Pages Router CSS strip.
- Both scaffolders are exact pins in `src/constants.ts`, tracked by the weekly upstream report (`SCAFFOLD_PINS` in `scripts/check-upstream-versions.ts` imports them). Angular 22 is held there until #156: `init` writes an `@/` import for Angular without the alias, which TypeScript 6 rejects.

---

## Test Guidelines

### Do Test

- Tier detection from `.env`
- Config validation with Zod
- Migration logic (Free↔Pro)
- Component registry lookups
- Error handling paths

### Don't Test

- Third-party libraries (Commander, Zod)
- File system mocking (use real temp dirs)
- Per-Template generated tests as the function oracle. The CEM function harness renders every committed React, Vue and Angular TypeScript Template in jsdom (issues #75, #76, #77); visual checks stay in the browser

### JSON with Comments

Use `readJSONWithComments()` when testing with Vite configs:

```typescript
import { readJSONWithComments } from '@/utils/json';

// tsconfig.app.json has comments that break fs.readJSON()
const tsconfig = await readJSONWithComments(tsconfigPath);
```

### Internals Exported for Test Coverage

Some command helpers are exported solely for direct unit testing when the surrounding command handler would require too much mocking to exercise the helper's logic in isolation. Current cases:

- `resolveComponents` in `src/utils/installed-components.ts` — shared by the `diff` and `update` commands, and asserted directly by `tests/unit/update-command.test.ts`, `tests/unit/diff-command.test.ts`, and `tests/unit/regression/f-095-community-component-skip.test.ts` (multi-word kebab↔PascalCase canonicalization, and the builtin/community split).
- `handleTierMigration`, `confirmMigration`, `confirmInstallation`, and `showPostInstallInstructions` in `src/commands/init/index.ts` — exported so `tests/unit/init-tier-migration.test.ts`, `tests/unit/init-post-install-instructions.test.ts`, and `tests/unit/init-validate-and-prepare.test.ts` can cover Free↔Pro migration prompts, post-install instruction branches, and the non-interactive paths without staging the entire `initCommand` orchestration.
- `tidyBlankLines` in `scripts/post-changeset-version.ts` — the whole blank-line policy for the generated changelog, asserted directly by `tests/unit/scripts/post-changeset-version.test.ts`. Exported so the invariants can be enumerated exhaustively (every sequence up to length 7 over `{blank, prose, bullet}`) rather than inferred from whole-changelog fixtures.

- `isPlaceholder`, `findSecretsInText`, `findHomePaths`, `findTrackedEnvFiles` and `isScannable` in `scripts/validate-no-secrets.ts` — the matchers, asserted directly by `tests/unit/scripts/validate-no-secrets.test.ts`. Exported so the placeholder-vs-real boundary can be pinned case by case without staging a repository full of fixture files. This is also the one file the validator exempts from its own scan, since its fixtures must look like real credentials to prove the matchers fire.

- `findBrokenLinks`, `isCheckableTarget`, `normalizeTarget` and `isExcluded` in `scripts/validate-doc-links.ts` — the link matchers, asserted directly by `tests/unit/scripts/validate-doc-links.test.ts`. `findBrokenLinks` takes its `exists` probe as an argument, so the checker is exercised without laying files on disk.

- `isPlaceholder`, `normalizeUrl`, `extractUrls` and `probe` in `scripts/check-external-links.ts` — the URL matchers and the HTTP check, asserted directly by `tests/unit/scripts/check-external-links.test.ts`. Exported so the placeholder-and-punctuation boundary and the HEAD-vs-GET fallback can be pinned without making a network request, which is the whole reason the reporter is weekly rather than part of `validate:all`. `probe` takes its `request` function as an argument so issue #37 (HEAD 404, GET 200) cannot regress without a live page.

- `parsePinned`, `majorOf`, `isMajorBump`, `classifyScaffold`, `groupStatus`, `readHolds` and `isHeld` in `scripts/check-upstream-versions.ts`: the version and hold matchers, asserted directly by `tests/unit/scripts/check-upstream-versions.test.ts`. Exported so the major-boundary rule (including the downgrade and unparseable cases), the hold-suppression rule (a hold covers its major, never a newer one, and never a release inside the pinned major) and the did-not-run rule (a group with a failed registry lookup is `unchecked`, never `current`, per docs/adr/0003) can be asserted without reaching the npm registry. Web Awesome is not read by this script at all — `wa-upgrade` (`scripts/check-wa-upgrade.ts`) owns that report — so `readWebAwesomePin` was removed rather than kept unused.

- `tagNames`, `attributeTypes` and `diffManifests` in `scripts/check-wa-upgrade.ts` — the manifest comparators, asserted directly by `tests/unit/scripts/check-wa-upgrade.test.ts`. Exported so the added/removed/changed boundary can be pinned against hand-built manifests rather than downloading two real Web Awesome tarballs per assertion.

- `printSummary` in `src/commands/add/index.ts` — the `add` command's whole reporting surface, asserted directly by `tests/unit/add-print-summary.test.ts`. Exported so the four reporting concerns (installed, cross-framework staged, overwritten-modifications warning, skipped/failed) can be pinned independently; the four helpers it delegates to stay private, so callers still see one function. The assertions were written against the pre-split 86-line version, which is what makes the extraction in issue #33 provably behaviour-preserving.

- `generateTypeScriptSource` and `generateCssMetadataSource` in `scripts/parse-custom-elements.ts` — the metadata emitters' output contract, asserted directly by `tests/unit/parse-custom-elements-types.test.ts`. Test-only seam: re-exported at the bottom of that module so a regenerated file that re-declares `ComponentMetadata` (or the CSS types) instead of importing `src/utils/metadata-types.ts` fails without a live CEM (issue #34).

- `extractVueSurface`, `compareVueVariants`, `checkReactJsVariantSubset` and `checkVueJsVariantSubset` in `scripts/check-generated-fresh.ts` — Check C's Vue SFC reader, its per-component comparer, and both arms' walks, asserted directly by `tests/unit/scripts/check-generated-fresh.test.ts`. Re-exported at the bottom of the module so each declaration the reader refuses, and each walk's pair count, can be pinned without running the whole guard (issue #122). The older helpers in that file (`extractReactSurface`, `diffSubset`, the CSS matchers) are still exported inline.

- `formatCompactProps` in `scripts/generate-skill-references.ts` — the prop list the skill API surfaces print, asserted directly by `tests/unit/scripts/generate-skill-references.test.ts`. Re-exported at the bottom of the module; the script only runs `main()` when it is the entry point (`isEntryPoint`), so importing it writes nothing (issue #129).

- `newestInputMtime` in `scripts/check-metadata-freshness.ts` — the newest mtime among the parser's inputs (the CEM and `dist/events/*.d.ts`), asserted directly by `tests/unit/scripts/check-metadata-freshness.test.ts` on a temp tree. Re-exported at the bottom of the module so an event declaration newer than the CEM can be shown to mark the metadata stale without touching the installed package's mtimes (issue #6).

If you add a similar export, keep it at the bottom of the module, mark its role in the accompanying test's describe block, and avoid adding new public callers — these are test-only seams.

---

## E2E Test Projects

E2E tests create temporary projects in `tests/.tmp-*`:

| Directory | Used by | Purpose |
| --- | --- | --- |
| `.tmp-e2e-smoke/` | `smoke.test.ts` | Real Vite project driven through the full CLI workflow |
| `.tmp-e2e-idempotent/` | `smoke.test.ts` | Second project, for the run-`init`-twice idempotency block |
| `.tmp-e2e-diff/` | `diff.test.ts` | Component comparison against a modified working copy |
| `.tmp-e2e-source-layout/` | `init-source-layout.test.ts` | One scaffold per framework/layout combination (issue #48) |
| `.tmp-e2e-{free,pro}-consumer-tsc-react/` | `consumer-tsc-react.test.ts` | Vite-React `init` + `add --all` + strict `tsc -b`, plus the Next pass (#73, #78, #79) |
| `.tmp-e2e-{free,pro}-consumer-tsc-vue/` | `consumer-tsc-vue.test.ts` | create-vite vue-ts `init` + `add --all` + `vue-tsc -b` (issues #78, #79) |
| `.tmp-e2e-{free,pro}-consumer-tsc-angular/` | `consumer-tsc-angular.test.ts` | `ng new` `init` + `add --all` + `ngc` (issues #78, #79) |

These are gitignored and recreated on each run.

---

## Browser Testing

Component behavior is verified manually in browser:

1. Build CLI: `pnpm build`
2. Scaffold a throwaway project somewhere outside the repo: `pnpm create vite my-kigumi-check --template react-ts && cd my-kigumi-check && pnpm install`
3. Initialize: `node /path/to/kigumi-cli/dist/index.js init --framework=react --yes`
4. Add component: `node /path/to/kigumi-cli/dist/index.js add dialog`
5. Run dev server: `pnpm dev`
6. Verify in browser

**Check:**

- Components render with styles
- Events fire correctly
- TypeScript has no errors
- Console has no errors

---

## Tier Migration Testing

Critical tests for Free↔Pro migration:

```bash
# Setup
npm create vite@latest tests/test-migration -- --template react-ts

# Test Free→Pro
cd tests/test-migration
node ../../dist/index.js init --framework=react --theme=awesome --yes
echo "WEBAWESOME_NPM_TOKEN=your_token" > .env
node ../../dist/index.js init --framework=react --theme=brutalist

# Verify: Only @awesome.me/webawesome-pro in package.json
grep webawesome package.json

# Test Pro→Free
rm .env
node ../../dist/index.js init --framework=react --theme=awesome

# Verify: Only @awesome.me/webawesome in package.json
grep webawesome package.json
```

---

## Adding Tests

1. Create test file in appropriate directory
2. Use `describe`/`it` from Vitest
3. Use real file operations (no mocking fs)
4. Clean up temp files in `afterAll`

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs-extra';

describe('myFeature', () => {
  const tmpDir = 'tests/.tmp-mytest';

  afterAll(() => fs.remove(tmpDir));

  it('works correctly', async () => {
    // test implementation
  });
});
```

---

## Angular Skill Evals

- `.claude/skills/kigumi-angular/evals/evals.json` -- 10 eval prompts covering variant remap, CVA, event suffixes, control flow, slot syntax

### Angular Starter Testing

Validate skill output in `~/Documents/dev/git/kigumi-angular/`:

1. Generate example component from skill output
2. Add to `src/app/` or `src/components/`
3. Run `ng build` -- must compile without errors
4. Run `ng serve` + visual verification via Chrome DevTools

---

**Parent:** [AGENTS.md](../AGENTS.md)
