# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-09-11

### Added

- Run all 15 validators on the weekly maintenance schedule, not only when a pull request touches a file. Drift caused by the outside world moving is now visible without anyone editing anything.
- Report external links in `README.md` and `NOTICE` weekly. Requests are sequential with a retry, so throttling is not mistaken for a dead page.
- Report weekly when Web Awesome or a tracked toolchain package publishes a version ahead of the pins. Upgrading stays a decision; nothing is changed automatically.
- Report weekly what a Web Awesome upgrade would actually involve. The check compares the published package's custom-elements manifest against the pinned one and names the components added or removed, the attributes removed or retyped on surviving components, and the six pin locations a bump has to update. It reads the free package, so it needs no Web Awesome token, and it never touches the pin.

All three reports open or update an issue and always exit successfully, so a third-party outage can never turn the repository red.

## [1.0.0] - 2026-09-10

### Added

A husky `commit-msg` hook that rejects AI attribution trailers
(`Co-Authored-By: Claude`, `Generated with ...`) before they enter the git
history. Prose mentioning Claude is deliberately still allowed, since the
history legitimately discusses Claude hooks and sessions.

Internal ESLint plugin scaffold (`tools/eslint-plugin-kigumi`) with a
RuleTester harness running in the existing unit-test lane. No lint rules are
enabled yet; this is the foundation the upcoming `class`-not-`className`,
listener-cleanup and typed-error rules build on.

`validate:fixture-exclusions` fails the build when `.prettierignore`,
`eslint.config.js` or `tsconfig.tests.json` stops excluding
`tests/fixtures/starter-snapshots`. Those files are recorded CLI output, so a
formatter rewriting them silently invalidates every snapshot diff.

`validate:no-secrets` fails the build when a tracked file contains a
provider-prefixed credential (Chromatic, npm, GitHub, Slack, AWS, OpenAI,
Anthropic, Stripe), an absolute home-directory path, or when a `.env` file is
tracked at all.

It matches on provider prefixes rather than entropy: an entropy scan flags
every hash and minified bundle, and a check that noisy gets switched off.
Placeholders like `your_token_here`, `/Users/you/...` and the existing test
fixtures are deliberately allowed so docs can keep showing the shape of a path
or token.

`validate:doc-links` fails the build when a relative markdown link points at a
path that does not exist.

A relative link is a claim that a file exists, and nothing verified those
claims. `.cursor/SKILLS.md` pointed at six skill files for six months after the
directory holding them was deleted, two skills sent readers to reference docs
that were never written, and three documents still pointed into
`docs/superpowers/`, removed when that workflow was retired.

External URLs, anchors, and links inside code blocks are deliberately not
checked: reaching the network makes the build flaky, and a link in a code
sample is syntax rather than a claim. `tests/fixtures/` is excluded, because a
fixture that links to a missing file is usually the point of the fixture.

`validate:gha-permissions` fails the build when a workflow job that runs
`actions/checkout` declares its own `permissions:` block without a readable
`contents:` scope. Job-level permissions replace the workflow-level ones rather
than merging, so a missing `contents: read` silently breaks checkout.

The Claude PreToolUse hook now denies file edits and commits while the session
is on the default branch, pointing at the worktree workflow CLAUDE.md requires.
Reads are unaffected, and `KIGUMI_ALLOW_MAIN=1` overrides it for the release
flow, which legitimately commits on `main`.

### Changed

First stable release. Kigumi's CLI surface, its `kigumi.config.json` format and
the shape of the components it generates are now covered by semantic versioning:
a breaking change to any of them requires a major bump.

Nothing in this release breaks an existing project. 1.0.0 signals maturity, not
a rewrite. Commands, flags and config keep working as they did in the 0.27 line,
and the version reflects that the surface is settled enough to promise that.

Projects pinned to a 0.x `kigumiVersion` keep working against the 1.x CLI. You
will see a one-time warning suggesting `kigumi upgrade`, which pins the project
forward; nothing is required of you before then.

Point `.changeset/config.json`'s `$schema` at `@changesets/config@4.0.0`, which
is what `@changesets/cli@3.0.2` now resolves. The URL is an editor hint only, so
nothing was broken, but a stale pointer sends editors to the wrong schema.

The repository moved to the `kigumi-ui` organisation.

`package.json`'s `repository` and `bugs` fields, and the repository URL the CLI
prints in its error messages, now point at
`https://github.com/kigumi-ui/kigumi-cli`. The npm package name is unchanged.

Retire the superpowers state-file workflow in favour of the mattpocock-skills
engineering flow. `release-readiness` no longer parses `INITIATIVES.md` or the
test-infra cluster table: those meta-checks were pinned to `v0.20.0`, six minor
versions behind the current release, so they could not fail for a real reason.
The gate suite, changeset count and version-vs-tag comparison are unchanged, and
the report now lands in `.claude/reports/` instead of the repository tree.

The interaction-test lane's story list now lives in one module
(`docs/.storybook-test/interaction-stories.ts`) that both
`.storybook-test/main.ts` and `vitest.storybook.config.ts` derive from, instead
of being typed out by hand in both. `validate:story-lanes` additionally checks
that list against the stories actually tagged `interaction`.

### Fixed

The release changelog no longer collapses multi-line entries into a single
paragraph.

`post-changeset-version.ts` dropped every blank line while bucketing changeset
bodies into categories. Any entry longer than one paragraph came out glued
together, separate entries ran into each other, and a fenced code block lost the
blank line markdown requires on each side. The 1.0.0 release PR failed
`format:check` on exactly that.

Blank lines inside an entry are now preserved and collapsed to one. A blank line
between two single-line bullets is still dropped, so ordinary bullet lists stay
tight rather than rendering with paragraph spacing. The generated output is
asserted against prettier's own markdown formatter in the unit lane, so this
class of failure can no longer reach a release PR.

Migrated the release workflow to `changesets/action` v2.

v2 renamed every input the workflow used (`version`, `publish`, `commit`,
`title`, `createGithubReleases`) and replaced the `GITHUB_TOKEN` env var with an
explicit `github-token` input. GitHub Actions ignores unknown `with:` keys
silently, so the v1-shaped call would not have failed CI. The next release would
have stopped opening the version PR and published unauthenticated.

v2 also dropped the action's own `.npmrc` handling, which is what consumed
`NPM_TOKEN`. Registry auth is now written explicitly before `changeset publish`,
into `$HOME` rather than the workspace so it cannot be swept into the release
commit, and it fails fast with an actionable message when the token is missing
or rejected.

The Storybook interaction lane no longer installs Playwright's system
dependencies, removing a hard dependency on Google's Debian mirror from CI.

`playwright install --with-deps` shells out to apt. When that mirror serves a
corrupted package index the job fails before running any test, which is what
repeatedly blocked the 1.0.0 release PR. Measured on a passing run, 24 of the 33
packages were already present on the runner; the 9 actually installed were fonts
with no bearing on a Latin-only, non-pixel-comparing test lane.

Native DOM events now get their real handler type in generated wrappers,
instead of `CustomEvent`.

Web Awesome's manifest gives each event a pascal-cased `eventName` (`blur`
becomes `BlurEvent`), which reads like a type but names no real DOM interface.
Each generator pattern-matched that string on its own, so they disagreed.
Handler types now come from the event's real DOM name through one shared table.

**React** — `change` is `Event`, `input` and `beforeinput` are `InputEvent`,
`load` and `error` are `Event`. `blur` and `focus` were already correct.

**Vue and Angular** — the same four corrections, plus `blur`, which was
`CustomEvent` and is now `FocusEvent`.

Web Awesome's own `wa-*` events are unchanged: they stay `CustomEvent`.

Your existing files are untouched; nothing changes until you regenerate a
component. When you do, a handler you had typed as `CustomEvent` will no longer
compile. Widening the parameter to the type listed above fixes it, and the new
type is the one the DOM actually delivers.

The Chromatic project token is no longer hardcoded in `docs/package.json`.

The `chromatic` script passed `--project-token=chpt_...` as a literal while the
CI workflow read the same credential from the `CHROMATIC_PROJECT_TOKEN`
repository secret. The workflow treated it as a secret and the local
convenience script did not. The script now relies on the environment variable
the Chromatic CLI already reads, and `docs/.env.example` documents it.

The husky hooks no longer carry an absolute path into the maintainer's home
directory. `post-commit` and `post-checkout` both pinned a `/Users/<name>/...`
interpreter path, which leaked a username to every clone and pointed at a
location that exists on no other machine. The path moves to an untracked
`.husky/.graphify-python`, read with `read` rather than the whitespace-stripping
used elsewhere, because stripping breaks any path containing a space.

Removed the dead `.cursor/SKILLS.md` index and the stale `docs/superpowers/`
references, including one in a `check:mocks` error message that sent developers
to a deleted design doc.

`kigumi init` no longer writes `baseUrl` into your `tsconfig.json`.

TypeScript deprecated `baseUrl` in 6.0 and removed it in 7.0, and
`typescript@latest` is now 7.x. Writing it meant a fresh project's very first
`tsc` run failed on a config Kigumi had generated:

```
error TS5102: Option 'baseUrl' has been removed. Please remove it from your
configuration.
```

The `@/*` path alias resolves relative to the tsconfig without it, so nothing
else changes. A `baseUrl` already present in your own tsconfig is left untouched.

`templates/AGENTS.md` claimed "a single set of 80 React templates" while the
real count was 84. `validate:agents` now checks component-count claims in that
file, which is the one AGENTS.md no validator previously opened.

`kigumi add` no longer refuses to run in projects created before 1.0.0.

The version check treats a differing major as fatal. Every 0.x project pins a
major of 0, so a 1.x CLI hard-failed in all of them with `VersionMismatchError`
before doing any work. Since 1.0.0 marked the surface stable rather than
changing it, that blocked every existing project for a release that broke
nothing.

A 0.x project on a 1.x CLI now warns and proceeds, pointing at
`kigumi upgrade` to pin the project forward. Later major jumps stay fatal.

### Removed

`scripts/state-files.ts`, `scripts/state-staleness.ts` and
`scripts/triage-finding.ts`, along with the `weekly-review` and `triage-finding`
skills; issue tracking moves to GitHub Issues.

`scripts/detemplate.ts`, a one-shot Handlebars migration tool whose own header
said it should be deleted once the migration shipped. No `.hbs` files remain and
handlebars is not a dependency.

`getProToken()` from `src/utils/tier.ts`, a pass-through wrapper around
`detectProToken()` with no callers outside its own tests.

`graphify-out/`, `docs/superpowers/` and `.claude/settings.local.json` are no
longer tracked. All three were already matched by `.gitignore` while remaining in
the index.

`templates/AGENTS.md` no longer ships in the npm tarball.

It is contributor documentation, not runtime input: every path it cites
(`../AGENTS.md`, `.claude/skills/`, `../../typecheck-shims/`) exists in the
repository and not in the package, so in a published install all of its links
dangle. The `files` array now names the three template directories explicitly
rather than all of `templates/`. A negation entry does not work here, because
pnpm ships the file anyway.

## [0.27.2] - 2026-08-23

### Fixed

- **Release flow**: `pnpm version` now bumps the sample `kigumi status --json` payload in `llms.txt` alongside `AGENTS.md`. It only ever synced `AGENTS.md`, so every release produced a release PR whose CI failed on `validate:generated-fresh` check E until someone hand-edited the file. Only the CLI's own version is rewritten; the nested Web Awesome version keeps tracking Web Awesome.
- **validate:generated-fresh**: The Web Awesome half of check E was inert. It read the pin from `pkg.dependencies`, but Web Awesome sits in `devDependencies`, so the version it compared against was always the empty string and its guard could never be true. It now reads both blocks and catches a drifting Web Awesome version in `llms.txt`.

## [0.27.1] - 2026-08-23

### Added

- **validate:wa-pins**: A new check that holds every location naming a Web Awesome version to the same exact version, and enforces the upgrade-path invariant that the newest `VERSION_MAP` entry matches `DEFAULT_WEBAWESOME_VERSION`. That invariant was previously unenforced: `kigumi upgrade` installs whatever the newest map entry names, so bumping Web Awesome without adding an entry made upgrade hand users an older Web Awesome than the CLI ships, with nothing failing. The check also rejects range syntax, since a Kigumi release targets one specific Web Awesome version and must never auto-float. It runs in `validate:all`, in CI as its own step, in the release-readiness gates, and in the stop hook whenever a file naming a version changes.

### Changed

- **validate:parity**: Angular is now checked alongside React and Vue. It had been excluded since the script was written, so Angular metadata was never verified in either direction; it turned out to be complete. Orphan counts are now tracked per framework rather than collapsing everything that is not React into a Vue tally.
- **registry**: The four `files.vue` paths that used a nested `components/<Name>/<Name>.vue` shape now use the flat `components/<Name>.vue` form their React and Angular siblings already used.
- **validate:changes**: The anti-pattern matcher moved into a pure, exported `scanAntiPatterns()` function covered by table tests, so a rule that stops matching fails a test instead of reporting success. The script now also carries an import guard, which is what makes it testable at all, and scans `.tsx` alongside `.ts`.

### Fixed

- **Agent skill references**: The generated `*-api-surface.md` files documented Web Awesome CSS part and attribute names incorrectly. They were run through Prettier, which reads `_` as emphasis syntax and rewrote the identifiers it found: `eyedropper-button__base` was stored as `eyedropper-button**base`, and `target="_blank"` as `target="\_blank"`. Agents copy these names verbatim into user code, so the reference was actively misleading. The files are now compared and committed as the generator emits them, and are excluded from Prettier so nothing re-mangles them.
- **validate:generated-fresh**: Check A could not pass on a checkout with a Web Awesome Pro CEM, because it compared Prettier-rewritten markdown against raw generator output. It now passes, and catches a re-introduced mangling.
- **CI**: Five validators now gate pull requests. `validate:changes`, `validate:stories`, `validate:parity`, `validate:agents` and `validate:cem-sync` ran only via `pnpm validate:all` or inside a local Claude session, so a human-authored PR bypassed them entirely. Each is now its own named step in the quality job, so a failure points at the check that failed.
- **tests/AGENTS.md**: Restored the missing `theme-install-local-source.test.ts` entry. Its absence made `validate:agents` fail on a clean tree, which is why the check could not be wired into CI before now.
- **llms.txt**: The sample `kigumi status --json` payload claimed version 0.26.0 against a 0.27.0 package.
- **validate:parity**: The check can now fail. Both finding types were hardcoded to `warning` while the pass/fail predicate only looked for `error`, so the script reported success no matter what it found, including the 57 real gaps it had been listing for months. Missing `files` entries and orphaned template directories are now errors.
- **registry**: Backfilled the 57 missing `files.vue` entries, so every component declares the frameworks it actually ships templates for. Each path was verified against the template file on disk.
- **validate:changes**: The script's header no longer advertises a `--fix` flag it never implemented, and its check list now matches what actually runs.

### Removed

- **validate:changes**: Dropped the `class`/`className` anti-pattern. Its regex required the `<wa-` tag to appear after the attribute, so it matched nothing for months; catching the real case (multi-line JSX) needs an AST rule rather than a line regex.
- **validate:changes**: Dropped `checkTierLogic()`, an empty function that still ran on every invocation and still appeared in the script's documented check list, reading as coverage that did not exist.

## [0.27.0] - 2026-08-18

### Added

- **New Web Awesome Pro components: Video, VideoPlaylist, DatePicker, DateInput.** Video (`wa-video`) is a video player with `none`/`standard`/`full` control presets, poster, captions, timeline thumbnails, and playback methods (`play`, `pause`, `seek`, `setVolume`, `requestFullscreen`, and more). VideoPlaylist (`wa-video-playlist`) groups `<Video>` elements into a playlist with `next()`/`previous()`/`goTo()` navigation and a `wa-video-change` event. DatePicker (`wa-date-picker`) is an inline calendar for single or range date selection with min/max, disabled dates, week numbers, and locale support. DateInput (`wa-date-input`) is a form-associated segmented date field with an optional popup calendar, validation, and clear button. All four are Pro-tier and require a Web Awesome Pro license.

### Changed

- **Web Awesome Pro documentation text is no longer bundled.** Pro is commercial software whose license does not permit passing its assets to people without a license, so the descriptions extracted from it are gone from the component metadata and type-check shims. Names, types and signatures stay, and the generated wrappers still compile identically. Pro licensees see the real descriptions from the package itself. Free-tier components keep their full documentation, and the attribution the Web Awesome license asks for now ships in `NOTICE`.

### Fixed

- **`diff` and `update` no longer skip community components silently.** Components installed from a community registry have no built-in template to compare against, so both commands dropped them from the scan and then reported "all components are up to date". They are now listed explicitly, with the registry they came from and what to do about them.
- **`llms.txt` reports the current versions.** The sample `kigumi status --json` payload still quoted kigumi 0.13.0 and Web Awesome 3.3.1, four minor releases behind. Corrected, and the version claims are now checked against `package.json` by `validate:generated-fresh` so they cannot drift again.
- **Registry cache keys now include the branch.** Two branches of the same registry repository shared one cache directory, so fetching from `owner/repo` and from `owner/repo/tree/staging` would overwrite each other's cached files. Each branch now caches independently.
- **Cached registry files now expire.** The one-hour cache lifetime was only checked on a code path the CLI does not use, so a component file downloaded from a community registry was served from disk indefinitely and `kigumi add --from` kept installing a stale copy. Cached files older than the lifetime are refetched.
- **`theme install` accepts local registry paths.** `kigumi theme install <name> --from ../sibling-repo` failed with "Only GitHub URLs are supported" even though `kigumi add --from ../sibling-repo` has always accepted local paths. Theme installs now use the same source parser as component installs, so relative paths, absolute paths, and `~` paths all work.

### Removed

- **Removed the inert `--no-types` flag from `kigumi add`.** The flag was accepted but never read: TypeScript output has always been controlled by the `typescript` field in `kigumi.config.json`, which `kigumi init` sets from your project. Passing `--no-types` silently did nothing, so it is gone rather than left as a promise the CLI does not keep.

## [0.26.0] - 2026-07-02

### Added

- **New Web Awesome 3.10.0 component: RandomContent.** A Free-tier display helper that randomly selects and shows one or more of its child elements, with `items`, `mode` (`random` / `unique` / `sequence`), `autoplay`, `autoplay-interval`, and `animation` (`fade` variants) props, a `wa-content-change` event, and an imperative `randomize()` method. Ships React, Vue, and Angular wrappers plus a docs-site wrapper and Storybook story. Note: Web Awesome currently marks the component as experimental, so its upstream API may still change; the exact version pin keeps installs stable.
- **Icon gains a `canvas` prop** (`fixed` / `auto` / `square` / `roomy`) for controlling how the icon is sized within its canvas, and Font Awesome 7.3.0 support with new Pro icon families (mosaic, pixel, vellum, slab-duo, slab-press-duo) and additional animation custom properties.

### Changed

- **Web Awesome upgraded from 3.9.0 to 3.10.0.** A non-breaking minor for existing components. The dependency stays exact-pinned for both the free `@awesome.me/webawesome` and Pro `@awesome.me/webawesome-pro` packages, and `kigumi doctor` now flags `3.9.0` projects as upgradable.
- **Icon `auto-width` is deprecated** upstream in favor of `canvas="auto"`. The prop keeps working, but the wrappers now mark it `@deprecated`; migrate to `canvas="auto"`.

## [0.25.0] - 2026-07-01

### Added

- **New Web Awesome 3.9.0 component: CheckboxGroup.** A Free-tier form control that labels and groups a set of checkboxes so they share hint text and validation, with `label`, `hint`, `orientation` (`horizontal` / `vertical`), `size`, `required`, and the SSR-only `with-label` / `with-hint` flags. Ships React, Vue, and Angular wrappers plus a docs-site wrapper and Storybook story.
- **Tree gains a `leaf-multiple` selection mode.** `<Tree selection="leaf-multiple">` lets multiple leaf nodes be selected while parent nodes only expand and collapse.

### Changed

- **Web Awesome upgraded from 3.8.0 to 3.9.0.** A non-breaking minor for existing components. The dependency stays exact-pinned for both the free `@awesome.me/webawesome` and Pro `@awesome.me/webawesome-pro` packages, and `kigumi doctor` now flags `3.8.0` projects as upgradable.
- **Transition tokens synced onto component defaults.** Following Web Awesome 3.9.0, the `--show-duration` / `--hide-duration` / `--easing` CSS custom properties on AccordionItem and TimeInput now default to the shared transition tokens (`var(--wa-transition-normal)`, `var(--wa-transition-fast)`, `var(--wa-transition-easing)`) instead of hard-coded literals, so they respond to theme-level transition tokens.

### Removed

- **`--wa-accordion-divider-color` removed from AccordionItem** (Web Awesome 3.9.0 dropped it due to improper scope). The AccordionItem docs no longer list it; theme accordion dividers via surrounding surface tokens instead.

## [0.24.0] - 2026-07-01

### Added

- **Four new Web Awesome 3.8.0 components**: Accordion, AccordionItem, TimeInput, and KnownDate. All are Free tier and ship React, Vue, and Angular wrappers plus docs-site wrappers and Storybook stories.
  - **Accordion / AccordionItem** group related disclosure panels with `mode` (`single`, `single-collapsible`, `multiple`), `appearance`, `icon-placement`, and `heading-level` controls, and expose `expandAll()` / `collapseAll()`.
  - **TimeInput** is a form control for a time of day, with `with-clear`, `with-now`, `hour-format`, `step`, and a `min`/`max` range.
  - **KnownDate** is a form control for a calendar date the user already knows, with `locale` and a `min`/`max` range.
- **New text utility classes documented** on the Typography foundations page: case transforms (`wa-text-uppercase`, `wa-text-lowercase`, `wa-text-capitalize`), alignment (`wa-text-start`, `wa-text-center`, `wa-text-end`, `wa-text-justify`), wrapping (`wa-text-wrap`, `wa-text-nowrap`, `wa-text-balance`, `wa-text-pretty`), and the `wa-prose` long-form content utility.

### Changed

- **Web Awesome upgraded from 3.7.0 to 3.8.0.** A non-breaking minor for existing components (zero registry prop-value drift). The dependency stays exact-pinned for both the free `@awesome.me/webawesome` and Pro `@awesome.me/webawesome-pro` packages, and `kigumi doctor` now flags `3.7.0` projects as upgradable.
- **Transition tokens synced onto component defaults.** Following Web Awesome 3.8.0, the `--show-duration` / `--hide-duration` CSS custom properties on Combobox, Details, Dialog, Drawer, Popover, Popup, Select, ToastItem, and TreeItem now default to the shared transition tokens (`var(--wa-transition-normal)` or `var(--wa-transition-fast)`, per component) instead of hard-coded millisecond literals, so they respond to theme-level transition tokens.
- **Drawer `light-dismiss` now defaults to `false`** (Web Awesome 3.8.0). A drawer no longer closes on an outside click unless you opt in with `light-dismiss`.

### Note

- Web Awesome 3.8.0 also revises a few internal behaviors that need no Kigumi code change: the textarea disabled state now matches the input styling, and form controls submit empty strings instead of `null` for empty values.

## [0.23.0] - 2026-06-27

### Changed

- **Web Awesome**: Upgraded the pinned Web Awesome version from 3.6.0 to 3.7.0. Kigumi 0.23.0 now installs Web Awesome 3.7.0 for all frameworks (React, Vue, Angular, Next.js). No breaking changes for existing components; component metadata, skill references, and templates were regenerated against the 3.7.0 custom-elements manifest.

## [0.22.0] - 2026-06-25

### Added

- **XS/XL and short-form sizes for form controls.** The 18 form controls that expose a `size` prop (Button, Callout, Checkbox, ColorPicker, Combobox, Dropdown, FileInput, Input, NumberInput, Radio, RadioGroup, Rating, Select, Slider, Switch, Tag, Textarea, ToastItem) now accept `xs`, `s`, `m`, `l`, and `xl` in addition to `small`, `medium`, and `large`, mirroring Web Awesome 3.6.0. `medium` remains the default.
- **`onBeforeinput` event on NumberInput.** Forwards Web Awesome 3.6.0's new `beforeinput` event; it can be cancelled with `event.preventDefault()` to block the value change.
- **Enum prop-value drift detection in `validate:cem-sync`.** The gate now diffs each registry enum `prop.values` against the live `custom-elements.json` attribute type (which the generated metadata does not carry). Registry values Web Awesome no longer accepts fail the build; newly-added Web Awesome values not yet surfaced are reported as warnings — closing the gap that let the 3.6.0 size widening pass silently.

### Changed

- **`wa-dropdown-item` `variant` corrected to match Web Awesome.** The accepted values are now `default` and `danger` (default `default`); the previously advertised `neutral` was never accepted by Web Awesome and has been removed.
- **`wa-scroller` `orientation` corrected to match Web Awesome.** The accepted values are now `horizontal` and `vertical` (default `horizontal`); the previously advertised `both` was never accepted by Web Awesome and has been removed.
- **Web Awesome upgraded from 3.5.0 to 3.6.0.** A non-breaking minor: no components were added or removed. The dependency is exact-pinned (free `@awesome.me/webawesome` and Pro `@awesome.me/webawesome-pro`), and `kigumi doctor` now flags `3.5.0` projects as upgradable.

### Fixed

- **CEM resolution now honours the pinned Web Awesome version.** `scripts/find-cem.ts` (and the duplicate resolver in `scripts/generate-skill-references.ts`) selected the highest `@awesome.me/webawesome-pro` version present in the pnpm store rather than the version pinned in `docs/package.json`. A stale higher version left in the store could silently contaminate generated metadata. Resolution now matches the pinned version exactly and only falls back to highest-wins when no pin is resolvable.
- **The `validate:cem-sync` drift guard now enforces the two reconciled enums.** With `dropdown-item.variant` and `scroller.orientation` corrected, their entries were removed from `REGISTRY_VALUE_ALLOWLIST`, so any future regression on these values fails the build instead of being downgraded to a warning.

## [0.21.0] - 2026-06-21

### Added

- **`kigumi brand` and `kigumi palette` accept `--yes` (F-148).** They were the only mutating commands without the flag, so a scripted `kigumi brand red --yes` failed with "unknown option '--yes'" while `init` / `add` / `update` / `upgrade` accepted it. With no positional argument, `--yes` keeps the current value without prompting; an explicit argument still wins.
- **`kigumi list` badges Pro components on Pro tier (F-149).** Every component previously rendered identically on Pro tier, so a Pro user could not tell which ones require Pro. Pro components now carry a `[Pro]` badge. Free tier is unchanged (dimmed `(Pro)` prefix), and Free components are never badged.

## [0.20.0] - 2026-06-19

### Added

- **`pnpm generate:react` / `pnpm generate:vue` / `pnpm generate:angular` / `pnpm generate:templates`** package.json scripts, mirroring the existing `generate:metadata` / `generate:skill-refs` pattern. Run after editing a generator script or `src/utils/component-metadata.ts` to regenerate the `templates/<framework>/**` tree.
- **Snapshot-pinned unit tests** for `scripts/generate-{react,vue,angular}-templates.ts` and `scripts/post-changeset-version.ts` (34 tests, 18 external snapshots), bringing all four scripts into the unit-only coverage gate at ≥70% per file (F-125, original cluster P phase 4 scope).
- ### Added
- **Cross-framework conversion**: New `--cross-framework` flag on `kigumi add` lets a project consume components from a community registry that targets a different framework. Source-framework files are staged into `.kigumi/foreign/<slug>/` (with `_meta.json` recording source/target framework and registry provenance) for an agent-driven conversion.
- **Local filesystem registries**: `kigumi registry connect` and `kigumi add --from` now accept absolute or relative filesystem paths in addition to GitHub URLs, via a new `RegistrySource` discriminated union (`GitHubRegistrySource | LocalRegistrySource`). Local sources skip the `~/.kigumi/cache` layer.
- **kigumi-cross-framework skill**: New end-user skill at `.claude/skills/kigumi-cross-framework/` that translates Kigumi components between React, Vue, and Angular. Reads `_meta.json`, loads the matching `kigumi-{target}` skill plus any relevant `kigumi-compose-*` skill via the Skill tool, applies state/effect/event/control-flow mappings, and writes the converted file. Published to `kigumi.style/.well-known/skills/`.
- **Foreign-files staging**: New `src/utils/foreign-files-staging.ts` helper writes the staged source files plus `_meta.json` and returns the canonical hand-off prompt. `.kigumi/foreign/` is seeded into the gitignore template.

### Changed

- **Angular: native event types now flow through `@Output()` declarations (F-139).** Wrappers previously emitted `EventEmitter<CustomEvent>` for every event because two latent bugs in `scripts/generate-angular-templates.ts` (`getEvents`/`getMethods` reading `e.type?.text` against a flat-string metadata shape, hidden by an OR-fallback) made every type fall back to `unknown`/`CustomEvent`. After the fix and a full template regeneration, native events emit their precise type, e.g. Button's `focusEvent` is now `EventEmitter<FocusEvent>`. WA-specific event types (`BlurEvent`, `WaInvalidEvent`, etc.) still fall back to `CustomEvent`; tracked as F-141 for a follow-up.
- **Angular: method parameters now have real types (F-139, F-140).** Wrappers previously declared every method parameter as `unknown` and cast the host element with `(p: unknown) => void`. After the fix they emit precise types from the CEM (e.g. `focus(options?: FocusOptions)`, `setCustomValidity(message?: string)`, `formStateRestoreCallback(state?: string | File | FormData | null, reason?: 'autocomplete' | 'restore')`). Bare-identifier non-builtin types (currently `ToastCreateOptions`) get a named `import type` from the WA module. A second latent bug in the cast-signature parser (naive `.split(':')` against types containing colons) was fixed by refactoring `MethodInfo` to carry structured `parameters: Array<{name, type}>`.
- **`kigumi registry connect`**: Framework mismatch is now downgraded from a hard error to a warning so consumers can connect a foreign-framework registry first and later use `--cross-framework` to fetch from it.
- **`FrameworkMismatchError`**: Now lists `--cross-framework` as a fourth resolution path in its suggestion bullets.
- ### Added
- **Next.js support — App Router and Pages Router, with or without `src/`.** `kigumi init` now detects any Next.js project (via `next` in `package.json` or a `next.config.*` file) and adapts the scaffold:
  - **Router-aware**: App Router projects get an `app/providers.tsx` (or `src/app/providers.tsx`) `KigumiProvider` client module so root layout can stay a Server Component. Pages Router projects get a clear post-install instruction for wiring `pages/_app.tsx` manually — Kigumi does not modify user-owned files.
  - **Pages Router CSS policy handled automatically**: Next's Pages Router forbids global CSS imports outside `pages/_app.tsx`. Kigumi detects this at generation time and (a) omits `import '@/styles/layers.css';` from `lib/kigumi.ts` and (b) strips the per-component `import './<Name>.css';` line from each generated wrapper. Users add `layers.css` + `theme.css` + `@/lib/kigumi` directly to `_app.tsx` per the post-install instructions.
  - **Layout-aware**: projects with `src/` get the traditional `src/components/ui` / `src/lib` / `src/styles` layout; projects without `src/` (e.g. `create-next-app` without `--src-dir`) get the parallel `components/ui` / `lib` / `styles` layout so the default `@/*` tsconfig alias resolves without edits.
  - **Generator flow**: skips `vite.config.ts` / `vite-env.d.ts` writes, emits a sibling `web-awesome.d.ts` without the `vite/client` reference, and falls back to `tsconfig.json` for path-alias configuration when `tsconfig.app.json` is absent.
- **`'use client'` directive injection.** Generated React components and `src/lib/kigumi.ts` are emitted with a leading `'use client';` directive when a Next.js project is detected. Non-Next React projects are unaffected.
- **`.kigumi/cache/` added to the generated `.gitignore`.** The registry cache is transient and should not be committed. `.kigumi/snapshots/` stays tracked because `kigumi update`'s three-way merge depends on it.
- **React templates now emit `suppressHydrationWarning` on the underlying `<wa-*>` element.** Lit-based Web Awesome components reflect default attributes (e.g., `appearance="outlined"`, `library="default"`) to the DOM during `connectedCallback`, causing React hydration mismatch warnings on Next.js / any SSR setup. `suppressHydrationWarning` is the documented React API for elements whose attributes mutate after hydration via a runtime — it suppresses only the host element (children are still hydration-checked), and it is a no-op in non-SSR contexts, so Vite-React SPAs see no change.
- **Next.js is treated as a React variant**, not a separate `framework` enum value. `config.framework` stays `'react'`; the Next-specific branches read `isNextProject(cwd)`, `detectNextRouter(cwd)`, and `detectSourceLayout(cwd)` at generation time, so the existing 74 React component templates are reused as-is for both routers and both layouts.
- ### Changed
- **Tree-shakeable WA component imports**: Generated wrappers now load their Web Awesome JS via a mount-triggered dynamic `import()` instead of a top-level side-effect import. Each component becomes its own async chunk, so bundlers (Webpack, Rollup, Vite, Turbopack) can drop unused components from route bundles. First visit to a route that uses a component pays one async fetch per new component; WA's `:not(:defined) { visibility: hidden }` covers the brief gap before registration. Applies to React (.tsx + .jsx), Vue (.vue TS + JS), and Angular wrappers. Run `kigumi update` to regenerate existing wrappers.
- **`kigumi doctor` advisory**: For React+TS projects, `doctor` now flags any remaining `src/types/web-awesome.d.ts` and tells the user to delete it. The file is never auto-removed so hand edits survive.
- **Troubleshooting doc**: "TypeScript errors on wa-\* elements" entry now points to `vite-env.d.ts` / `web-awesome.d.ts` and suggests running `kigumi doctor` to find stale legacy files.
- **Tier and Next-project context are now detected once per command and threaded through downstream helpers.** Previously `detectTier` / `detectTierSync` was called 19 times across 13 files (including redundant calls inside `handleExistingConfig` and both `buildConfigNonInteractive` / `buildConfigInteractive`), and `isNextProject` / `detectNextRouter` were called once per component inside `generateComponent` and `regenerateKigumiSetup`. The init command now resolves tier in `validateAndPrepare` and passes it via `InitContext.initialTier` to `handleExistingConfig`, the config builders, and the post-build `newTier` derivation. The add and update commands resolve tier plus `isNext` / `nextRouter` once at the command entry and forward them through `ComponentInstaller` / `processComponent` into `generateComponent`. `generateComponent` and `regenerateKigumiSetup` keep their internal detection as a fallback for callers without command context (tests, framework plugins). `config-builder.ts` also switched from `detectTierSync` to `await detectTier` to stop blocking the event loop in already-async code. Net effect: `kigumi init` drops from 4 `detectTier` calls to 1, and `kigumi update` / `kigumi add --all` collapse per-component next-context probes from O(N × 10) to O(10). (F-012, F-015, F-016, F-039)
- ### Removed
- **Vestigial schema surface (F-060/061/064).** Three dead fields/exports dropped from the public config schema. `webAwesome.cdnUrl` (no runtime reader, intended for an unshipped CDN-install mode) is gone. `validatePartialConfig` (zero callers in `src/`, duplicated `validateConfig`'s error formatting) is deleted with its 5-test describe block. `config.aliases` (a 3-key map persisted by `init` and preserved on update, but read at runtime in exactly one place that did string-match-and-fallback gymnastics on the same value) is removed; `resolveImportBase` now returns `toKigumiAlias(config.componentsDir)` directly — same behavior with one less knob to drift. Configs carrying any of these fields lose them silently (Zod strips unknown keys); follow-up F-067 will surface that loudly via `.strict()`.
- **`getConfig()` JSDoc and module header (F-063).** Removed the misleading "cached" descriptor — there is no caching anywhere in `src/utils/config.ts`; every call constructs a fresh cosmiconfig explorer. Wording now reflects the actual behavior: resolved configuration with defaults applied. F-033's one-call-per-command invariant makes runtime caching unnecessary.
- **`tierSchema` relocation (F-066).** Moved `tierSchema` and `type Tier` out of `src/schemas/config.ts` (which explicitly disclaims tier as a config field — "tier is NOT stored in config") and into `src/utils/tier.ts` next to `detectTier()` and `detectTierSync()`. Single source of truth: the Zod schema defines the type, runtime utilities live alongside it. Importers in `src/schemas/options.ts` updated; barrel re-export removed from `src/schemas/index.ts`.
- ### Changed
- **`pnpm build` no longer duplicates `templates/` into `dist/` (F-042).** The runtime always read templates from package root via `findPackageRoot`; the `dist/templates/` and `dist/llms.txt` copies emitted by `scripts/post-build.ts` were dead weight that bloated every install by ~5 MB. `scripts/post-build.ts` is removed and the `build` script is now plain `tsup`.
- **`tsup.config.ts` is now a single config with an entry map (F-043).** Replaces the previous two-config array whose order was load-bearing: only the first config had `clean: true`, so swapping the entries silently wiped the prior build. The new config emits `dist/index.js`, `dist/index.d.ts`, and `dist/bin.js` with the shebang preserved. tsup additionally emits content-hashed `chunk-*.js` / `install-*.js` helpers alongside the entries because both share imports; they ship together in the tarball (which still drops by ~5 MB net thanks to F-042).
- **Theme sub-commands route all user-facing output through `getOutput()`.** `theme list`, `theme show`, and `theme set` previously called `@clack/prompts` directly (`p.intro`, `p.note`, `p.outro`, `p.spinner`), bypassing the output abstraction used by other commands. (F-085)
- **Lazy `await import('../utils/tier.js')` calls converted to static imports** in `theme.ts`, `palette.ts`, `theme/list.ts`, and `theme/set.ts`. (F-086)
- ### Changed
- **`kigumi palette`, `brand`, `theme`, `theme install`, `theme set`, `registry connect`, `registry remove`, and `registry list` now load `kigumi.config.json` exactly once per invocation.** Each of these eight command entry points called `loadConfig()` and then `getConfig()`, but `getConfig()` internally calls `loadConfig()` — so every command ran two cosmiconfig searches for the same file. The redundant direct call has been removed across all eight; resolved config and pre-flight check behavior are unchanged. Internal cleanup with no user-visible change other than a marginally faster start. Mirrors the earlier `kigumi add` fix.
- ### Fixed
- **`getConfig()` now deep-merges nested config objects with defaults.** Previously a shallow spread (`{ ...DEFAULT_CONFIG, ...userConfig }`) caused partial `theme`, `webAwesome`, or `aliases` config in `kigumi.config.json` to silently lose default values. A user config with `{ theme: { selected: "awesome" } }` lost `palette` and `brandColor` defaults; a user config with partial `aliases` lost the other default entries. `getConfig()` now delegates to `mergeWithDefaults()`, which deep-merges these nested objects and additionally validates the result against the Zod schema -- surfacing invalid configs that previously passed silently. Unknown top-level properties not declared in the schema are now stripped from the resolved config.
- **`kigumi init` now preserves `installedComponents` on re-init.** `preservePersistentFields()` in `config-builder.ts` used `existingConfig.installedComponents?.length` to guard the copy, but `installedComponents` is a `Record<string, InstalledComponent>` per the schema, not an array -- so `.length` was always `undefined` and the field was silently dropped. Non-empty records are now correctly carried over, matching the existing `installedThemes` pattern.
- ### Fixed
- **Test infrastructure: e2e smoke-test tier isolation.** The Free-tier smoke test in `tests/e2e/smoke.test.ts` did not clear `WEBAWESOME_NPM_TOKEN` or `KIGUMI_SKIP_GLOBAL_NPMRC` for the `kigumi init` / `kigumi add` subprocesses, so a developer running the suite locally with a Pro token configured globally would see `kigumi init` resolve to `@awesome.me/webawesome-pro` and the `dependencies['@awesome.me/webawesome']` assertion fail. CI runners have neither the token nor a global npmrc, so the failure was local-only. Adds a `FREE_TIER_ENV` constant (mirrors the integration-test helper) and threads it through every `kigumi` execa call in the file, including the Idempotency block.
- Fix React fallback test template to query the `<wa-*>` element by tag name and assert on `.className`, matching the canonical pattern from dedicated `.test.tsx.hbs` templates. Previously the fallback emitted `container.querySelector('.custom-class')` with `.toBeInTheDocument()`, which would pass incidentally even if the class landed on a wrapper element. Affects only new components installed without a dedicated test template; all 74 shipped components have dedicated templates and are unaffected.
- ### Fixed
- **Free-tier projects can no longer select Pro palettes.** `TIER_RESTRICTIONS.palettes.free` incorrectly listed all 9 palettes, so `kigumi palette elegant` (or any of the other Pro palettes) on a free-tier project would write the palette to `kigumi.config.json` even though the Pro CSS was never loaded, so the runtime silently fell back to the default palette and the config was a lie. Free projects now see only `default`, `bright`, and `shoelace`, matching the Web Awesome free tier. Existing free-tier configs with a Pro palette value are silently reset to `default` on the next `kigumi init --force` via the pre-existing fallback path. (F-013)
- **`PALETTE_OPTIONS` carries `pro: true` markers and a new `getPaletteOptionsForTier(tier)` helper**, matching the existing `THEME_OPTIONS` / `getThemeOptionsForTier(tier)` pattern. Internal utility; no surface change for generated projects.
- ### Fixed
- **Next.js Pages Router + Webpack: WA theme CSS variables now apply at `:root` (F-038).** Pages Router's CSS pipeline (`next-css-loader` + `postcss-import`) drops the whole `@import … layer(…)` line when it inlines the chain, so the theme stylesheet (`default.css`) never entered the bundle. `--wa-color-brand-*`, `--wa-font-family-*`, and palette role tokens ended up empty at `:root`; components rendered with fallback appearance even though they upgraded correctly. `layers.css` now emits plain `@import` statements on Pages Router, which Webpack accepts. The `@layer base, theme;` declaration still emits so any named-layer authoring the user adds keeps `base < theme` order; the WA imports themselves land as unlayered styles, which outrank named layers via cascade semantics. App Router (Turbopack) and Vite are unchanged, they preserve the qualifier. The 0.20 "Known limitation" callout and manual `_app.tsx` workaround in the Upgrading guide are removed.
- ### Fixed
- **CSS scaffolds now include parts and custom-properties for 64 of 74 components** (previously only 7). `scripts/css-metadata.ts` is now derived from Web Awesome's `custom-elements.json` on every `pnpm generate:metadata` instead of being hand-maintained, so generated `.css` files for React, Vue, and Angular ship with the accurate `::part()` and `--wa-*` reference block as comments. (F-041)
- **Stale Shoelace-era part names are fixed.** The hand-maintained entries referenced pre-WA-3.x part names (e.g. Button `prefix`/`suffix`) and leaked global theme tokens (`--wa-spacing-*`) into per-component scaffolds. Both are replaced by the authoritative CEM data (`start`/`end` for Button; no global tokens). (F-041)
- **Angular CSS scaffolds now contain their parts and custom-properties.** The Angular generator's lookup used the PascalCase `component.name` against the kebab-case `CSS_METADATA` map, silently dropping the comment block from every `*.component.css` file. The Angular generator now also emits the custom-properties section (with `(default: ...)` suffix where CEM declares one), matching the React and Vue output. (F-053)
- **`validateCSSMetadataCoverage` removed from `scripts/validate-registry.ts`.** The warning was there to surface hand-maintained gaps; with CEM-derived data, "missing from map" now means "no CSS styling surface" (utility components like `wa-animation`, `wa-format-*`, `wa-*-observer`) and is expected. The validator is silent where it used to emit 67 warnings.
- **`pnpm generate:metadata` formats its output through prettier.** `JSON.stringify` emits raw double-quoted output, so the script's previous write path drifted against the committed prettier-formatted files on every re-run. Regeneration is now idempotent.
- Fix React 19 ref-typing errors in all 75 React templates by switching to a callback-ref pattern with WaXxx class type imports. Pro shim hardened from unknown stubs to accurate class declarations with method signatures (combobox, toast, file-input, number-input). Side-effect corrections: removed private show/requestClose methods from Dialog/Drawer ref interface (use the open attribute instead) and static getMarked/updateAll from Markdown ref interface. (F-072)
- Generated React TypeScript test stubs now emit three `it` blocks per component (renders / className passthrough / required-attribute reflection) with realistic placeholder values, matching the quality of the hand-maintained `.test.jsx` variants.
- ### Fixed
- **Multi-word components (e.g. `ButtonGroup`, `TreeItem`, `ColorPicker`) are now correctly resolved by `kigumi diff` and `kigumi update`.** The `resolveComponents` scan branch used `name.toLowerCase()` to build registry keys, which produced `buttongroup` instead of `button-group` and silently skipped ~25 of 74 components — `diff` and `update` would simply not see them. The explicit-name branch normalised user input with a naive `charAt(0).toUpperCase()`, turning `button-group` into `Button-group` and breaking the downstream snapshot/config lookups. Both branches now go through a new `normalizeComponentName(input)` helper in `src/utils/registry.ts` that returns the registry's canonical `component.name` (so casing is always taken from the registry, never reconstructed from the kebab form), or `null` for unknown inputs. The two `processComponent` / `diffComponent` lookups use `toKebabCase` to defend against PascalCase inputs as well. (F-018)
- **Angular test-template lookup now uses kebab-case filenames on every filesystem.** `generateComponentTestContent` looked for `ButtonGroup.component.spec.ts.hbs` while the real template files are `button-group.component.spec.ts.hbs`. On case-insensitive macOS the lookup coincidentally succeeded; on case-sensitive Linux CI it fell through to the inline fallback generator, producing different tests per OS. The lookup now mirrors the Angular-aware branch already used for component and CSS template lookups. (F-025)
- ### Fixed
- **`post-changeset-version.ts` now bumps the AGENTS.md version marker in lockstep with `package.json` (F-145).** The post-`changeset version` processor reformatted CHANGELOG.md but left the `**Version**:` line in AGENTS.md pointing at the previous release. `validate-agents` requires that marker to equal `package.json`, so `validate:all` failed on every version bump until someone edited AGENTS.md by hand. The processor now rewrites the marker to the freshly-bumped version in the same step, keeping the release gate green without manual intervention. (F-145)
- ### Added
- **`kigumi add` warns when a component's registered dependencies are not installed.** Adding `select` without `option`, `carousel` without `carousel-item`, etc. used to render a visually broken component with no signal at install time. The installer now walks `component.dependencies` before the install loop and emits a single warning per requested component listing any missing deps, along with the exact `kigumi add …` command to fix them. The warning is informational only — the install proceeds and the dependencies are never auto-added, matching the CLI's "explicit user action" philosophy. Suppressed on re-runs where the parent is already installed. (F-020)
- **`pnpm validate:registry` now flags components without a `CSS_METADATA` entry in `scripts/css-metadata.ts`.** Missing entries cause the build-time template generators to emit `.css.hbs` templates without parts / custom-property comments. The check emits warnings (not errors) so adding a new component upstream does not block validation — the gap simply becomes visible. (F-023)
- **Registry data model cleaned up.** `ComponentDefinition` no longer carries optional `events?/slots?/methods?` fields — those lived only in `src/utils/registry/types.ts` as dead decoration and were never read at runtime. Events, slots, and methods are produced by `scripts/parse-custom-elements.ts` into `src/utils/component-metadata.ts` and consumed there by the build-time template generators. `validate:cem-sync` now only checks key coverage between the registry and CEM instead of chasing 130+ false-positive drift warnings against the partial registry fields. (F-019)
- ### Fixed
- **Error messages now reference the current env var and config file names.** The `TokenRequiredError`, `TierRestrictionError`, `ProComponentRequiredError`, `ProThemeRequiredError`, and `AuthenticationError` (Web Awesome branch) suggestion steps previously referenced the old env var `WA_TOKEN`; they now use `WEBAWESOME_NPM_TOKEN`. The same classes, along with `ConfigNotFoundError`, `ConfigFieldMissingError`, `ConfigFieldInvalidError`, the `kigumi theme set` spinner, and the docs-site troubleshooting page, previously referenced the old config filename `kigumi-components.json`; they now use `kigumi.config.json`. `TokenRequiredError.context.checked` now lists all three detection sources in priority order (`process.env.WEBAWESOME_NPM_TOKEN` → `~/.npmrc` → `.env`) to match `src/utils/token.ts`. Users who copy token-setup steps from error output will set the correct env var and look for the correct config file. (F-008, F-034, F-035, F-036)
- ### Changed
- **Tightened registry validation (`scripts/validate-registry.ts`).** Two author-time checks that previously let invalid data slip through are now strict:
  - `validateTagName` now requires exact equality between the registry key (normalised to kebab-case) and the tag name without its `wa-` prefix. Previously a substring check allowed a key like `input` to silently pass against `wa-number-input`. (F-021)
  - A new `validateProps` pass inspects each entry in `component.props`: the `name` must be non-empty, the `type` must be one of `string | boolean | number`, `values` (when declared) must be an array, and a declared `default` must be one of the declared `values`. Previously only `Array.isArray(component.props)` was checked, so malformed prop definitions could reach the template layer. (F-022)
    Current registry data already conforms, so `pnpm validate:registry` continues to pass. The validator functions are now exported and `main()` is guarded so they can be unit-tested in isolation (mirrors `validate-cem-sync.ts` / `validate-parity.ts`).
- ### Fixed
- **Vue wrappers no longer forward `false` boolean props to the underlying `<wa-*>` element.** Vue's runtime boolean-prop coercion materialized absent optional `Boolean` props as `false`, which the previous `definedProps` filter (which dropped only `undefined`) let through. Because Web Awesome elements read attribute presence as truthy, `<Button variant="brand">` rendered as `<wa-button … pill="" disabled="false" loading="" with-caret="false">`, pill-shaped and with a stuck loading spinner. The filter now drops `undefined` and `false` before `v-bind`. Affects every Vue component with optional boolean props (Button, Input, Switch, Checkbox, Drawer, Dialog, etc.). No change to React or Angular templates. Existing Vue projects must run `kigumi update --force` after upgrading to regenerate their component wrappers with the corrected filter. (F-068)
- ### Changed
- **CSS component templates now carry the `.css` extension instead of `.css.hbs`.** All 222 CSS templates across `templates/{react,vue,angular}/` were static CSS with zero Handlebars expressions. The `.hbs` suffix misled contributors into thinking `{{name}}` etc. would work there, and forced the CLI to run every CSS file through the Handlebars compiler on every `kigumi add` invocation. Templates are now read verbatim via `fs.readFile`. The validator, template generators, and contributor docs have been updated to match. Authors adding new components should create `{Component}.css` (or `{kebab-name}.component.css` for Angular) alongside the `.hbs` files for the other artifacts. (F-031)

### Fixed

- Six commands (`upgrade`, `status`, `doctor`, `update`, `diff`, `theme show`) now produce `ConfigInvalidError` with formatted Zod issues instead of `TypeError` when the on-disk config is malformed.
- `kigumi add`, `kigumi theme set`, `kigumi palette`, `kigumi brand`, and the registry commands no longer regrow `utilsDir` / `stylesDir` / `webAwesome` keys a user has deliberately removed from their config.
- Running `kigumi add` from a monorepo workspace with no local config now fails with `Configuration file not found` (with a ready-to-run `kigumi init` suggestion) instead of silently mutating the repo-root config.
- **Changelog: commit hashes are stripped from indented bullets (F-142).** `scripts/post-changeset-version.ts`'s hash-stripping regex (`/^- [a-f0-9]{7}: /gm`) ran before the indent-unwrap step, so changesets that wrap entries inside `### Patch Changes` bullets (`  - abc1234: …`) kept their hashes through the rewrite. Reordered so hash-stripping runs after unwrapping; both un-indented and originally-indented entries are now cleaned.
- **`component-metadata.ts` is regenerated when stale (F-044).** The `prebuild` step previously only regenerated when the file was missing, so bumping `webawesome-pro` and running `pnpm build` without first running `pnpm generate:metadata` silently shipped wrappers missing the upgraded CEM's new props and events. The new `scripts/check-metadata-freshness.ts` compares mtimes between the CEM and the generated metadata; either staleness or absence triggers regen. `findCustomElementsJson` was lifted into `scripts/find-cem.ts` so the parser and the freshness check share a single implementation.
- **`pnpm audit --audit-level=critical` now blocks the maintenance workflow (F-049).** Previously ran with `continue-on-error: true`, so critical advisories produced a green checkmark. Trivy stays as defense-in-depth; pnpm audit catches transitive-dep advisories Trivy misses.
- ### Removed
- **Deleted dead `src/frameworks/` plugin system.** The `FrameworkPlugin` interface, `FrameworkRegistry` class, and per-framework plugin classes (`ReactPlugin`, `VuePlugin`, `AngularPlugin`, `SveltePlugin`) had no production callers. Real component generation runs through `commands/add/installer.ts` → `utils/template.ts`; real framework detection uses `utils/detect-framework.ts`. Removing the directory eliminates ~1,212 lines of unreachable code and collapses the three duplicated `findPackageRoot` helpers to the single copy in `utils/template.ts`. (F-024, F-028)
- **Dropped `'svelte'` from the `framework` enum** in `kigumi.config.json` schema and community registry schemas. Svelte has never had templates or a working code path; schema validation now rejects `framework: 'svelte'` with a clear "Must be one of: react, vue, angular" error instead of failing deeper in the install flow with a confusing file-not-found. (F-029)
- ### Added
- **Test infrastructure: react generator filename catcher (cluster V follow-up).** Adds `tests/unit/scripts/generate-react-templates-output.test.ts`, which mocks `writeFormatted` and asserts that `generateComponentTemplates` writes exactly `<Name>.tsx`, `<Name>.css`, and `<Name>.test.tsx` for each component (paths derived verbatim from `component.name`, no transformations). Exposed via a one-line `export` on `generateComponentTemplates` in `scripts/generate-react-templates.ts`. Closes the test-suite gap identified during the Cluster V bug-injection gate — generator-filename mutations now turn a unit test red instead of silently producing orphan files alongside stale committed templates.
- ### Added
- **Test infrastructure: bug-bash regression suite + bug-injection runbook (cluster V, PR-V2).** Adds `tests/unit/regression/` with 10 entries (65 tests) — each protecting a specific historical PR/F-ID and verified by reverting the original fix on a scratch branch. Headers cite the PR + the symptom + the fix SHA. Adds `scripts/bug-injection-gate.md`, the runbook for the one-time acceptance gate (5 deliberate bugs, full-suite kill check). The cluster V spec wrote the path as `tests/regression/`; execution placed it under `tests/unit/regression/` so the existing `pnpm test`/`check:mocks`/`tsconfig.tests.json`/`vitest related` machinery covers them automatically. `tests/AGENTS.md` documents the regression-suite contract and the mutation-testing workflow.
- ### Changed
- **Test infrastructure: mutation testing scaffold (cluster V, PR-V1).** Adds [StrykerJS](https://stryker-mutator.io/) with an 80% break threshold and a weekly `mutation.yml` workflow (Sundays 02:00 UTC + manual dispatch). Run locally with `pnpm test:mutation`. Mutation reports land at `reports/mutation/mutation.html` (gitignored); CI uploads them as a 30-day artifact. The mutate scope is `src/utils/tier.ts` only for the V1 baseline (verified at 89.13% kill rate). Two upstream blockers ruled out wider scopes: `@stryker-mutator/vitest-runner@9.6.1` + vitest 4.x hangs the dry run with `coverageAnalysis: 'perTest'`, and the workable fallback `coverageAnalysis: 'all'` is incompatible with `ignoreStatic`, so kigumi util modules with module-level data (registry tables, default-config constants) explode the runtime when scope widens beyond ~5 files. Subsequent V cluster work or follow-ups widen the mutate scope as covering tests land for additional files (per the V spec at line 246, which permits per-file/subdir splits). No user-visible CLI behaviour changes; the only runtime touch is `vitest.unit.config.ts` gaining an explicit `include: ['tests/unit/**/*.test.ts']` (matching the previously-existing line in `vitest.config.ts`) so Stryker's vitest-runner doesn't pick up template stub specs that import `.vue`.
- ### Changed
- **CI: `pnpm typecheck:templates` is now a Quality Checks gate.** Every PR runs three checks in order: `tsc` against `templates/react/tsconfig.json`, then `vue-tsc` against `templates/vue/tsconfig.json`, then `tsc` against `templates/angular/tsconfig.json`, catching template-level type errors at PR time instead of at user-install time. No change to generated component output.
- ### Changed
- **`kigumi add` now loads `kigumi.config.json` exactly once per invocation.** The previous flow called `loadConfig()` and then `getConfig()`, but `getConfig()` internally calls `loadConfig()` — so the command ran two cosmiconfig searches for the same file. The redundant direct call has been removed; the resolved config and all pre-flight check behavior are unchanged. Internal cleanup with no user-visible change other than a marginally faster start for the `add` command.
- ### Changed
- **`kigumi add` now writes `src/components/index.ts` with alphabetically sorted exports.** Previously, new barrel exports were appended in installation order, which made the file harder to scan as more components were added. The order of the exports in an existing index file is now normalized on every `add`. No behavioral change to the generated component code itself; only the order of lines in the barrel file is affected.
- ### Fixed
- **`kigumi theme list` and `kigumi theme show` are now wired into the router.** Both commands previously produced Commander's "unknown command" error because their `Command` exports were never `.addCommand()`'d on the parent `themeCommand`. (F-077)
- **Errors from `kigumi theme set` now route through the structured output layer.** The catch block previously called `handleError(error)` without passing `output`, falling back to raw `console.error`. (F-078)

### Removed

- **`ConfigValidCheck` (F-056).** Always returned `passed: true` whenever a config object was attached — pure decoration, validating nothing. With `getConfig` now throwing `ConfigInvalidError` directly, the check class, its registration in nine commands, and its describe block in `tests/unit/config-checks.test.ts` are gone.
- **Dead `updateKigumiImports()`**: `kigumi add` no longer calls `updateKigumiImports()` on the installer — the method looked for a `// Import Web Awesome components` marker that hasn't been emitted into `kigumi.ts` by the generator in many releases, so it was a silent no-op. Components register themselves on mount now.
- ### Removed
- **Hand-rolled `src/types/web-awesome.d.ts`**: `kigumi add` no longer writes a second, hand-rolled TypeScript declaration file for `wa-*` elements. The file produced by `kigumi init` — `src/vite-env.d.ts` for Vite projects, `src/web-awesome.d.ts` for Next.js — imports `CustomElements` and `CustomCssProperties` directly from the Web Awesome package and already covers every `wa-*` tag with full prop, event, ref, and `CSSProperties` typing. The old file was a strict subset of those types and caused TypeScript to merge two incompatible `IntrinsicElements` shapes when both existed.
- **Dead `updateViteEnvTypes()`**: `kigumi add` no longer invokes the regex-based inserter on `src/vite-env.d.ts`. The function guarded on a legacy `auto-managed` comment that the modern `init`-generated file never contains, so it already bailed out silently on every real project.
- **Orphan `templates/react/vite-env.d.ts.hbs`**: Template was never rendered — `init` writes the file from a string literal. Deleted.
- **`handlebars` removed from `dependencies`.** No longer needed at runtime or build time. CLI install footprint drops by the Handlebars runtime (~80 KB).
- ### Fixed
- **`detectPreviousTier` now matches `detectTier` on `devDependencies`.** The init command's tier-migration detection previously only scanned `packageJson.dependencies`, so projects that installed `@awesome.me/webawesome-pro` in `devDependencies` (e.g. component libraries building against Pro) were classified as previously Free and skipped tier migration entirely. Both dependency fields are now merged before the lookup, matching `detectTier`'s contract. (F-014)
- **Dead `quoteProp` Handlebars helper and unused `TemplateContext.kebabName` / `TemplateContext.props` fields** in `src/utils/template.ts`. None of the 222 `.hbs` templates ever referenced these; `buildTemplateContext` populated `props` for every render with no consumer. (F-026)
- **`src/utils/css-metadata.ts`** (moved to `scripts/css-metadata.ts`). Its `CSS_METADATA` table was consumed only by the three build-time generator scripts (`generate-{angular,react,vue}-templates.ts`), while the runtime exports (`generateCSSTemplate`, `getCSSMetadata`) were reached only as a fallback for components without a `.css.hbs` template, a path unreachable in practice because every supported component has one. The data moves next to its build-time consumers; the fallback is replaced with a `throw` so a missing CSS template after adding a new component fails loudly instead of silently emitting a placeholder. (F-027)
- ### Changed
- **`kigumi add` now detects tier exactly once per invocation.** The `add` flow previously called `detectTier()`/`detectTierSync()` three times -- once in `addFromBuiltinRegistry()`, again in `generateComponent()`, and a third time in `ComponentInstaller.updateKigumiImports()`. Each call re-read `package.json` and the token fallback chain (`~/.npmrc`, project `.env`) from disk. Tier cannot change mid-command, so the detected value is now resolved once in the command entry point and threaded through `ComponentInstaller` and `generateComponent()` as a parameter. `generateComponent()` keeps its legacy detection as a fallback for callers outside the add flow (update/diff, framework plugins) to remain backwards-compatible; the broader cleanup across all call sites is tracked separately. No user-visible change -- redundant I/O eliminated.
- ### Removed
- **Dead `src/schemas/tier.ts` module removed.** The file held a stale copy of tier-validation logic — `TIER_THEMES`, `AVAILABLE_PALETTES`, `AVAILABLE_BRAND_COLORS`, `PRO_COMPONENTS`, plus related Zod schemas and helpers — with invented theme/palette/component names that no longer (or never) matched the real Web Awesome registry. The module had zero runtime consumers; its only references were the re-export block in `src/schemas/index.ts` and its own test file `tests/unit/tier-schema.test.ts`, which validated the stale data and gave false confidence. Both are deleted, and the historical NOTE in `tests/unit/tier-consistency.test.ts` is trimmed to drop the "follow-up spec will remove it" pointer. Runtime tier logic continues to live in `src/utils/tier.ts` and registry-sourced `component.tier` fields. No public API change — the CLI package has no library exports. (F-010)
- ### Removed
- **Deleted unused `src/utils/token-manager.ts` module.** The module exported `loadTokenFromEnv`, `saveTokenToEnv`, `promptForToken`, and `isValidTokenFormat`, but had no runtime consumers; it was only referenced by its own test file. Its `.env` parser duplicated the canonical token detection in `src/utils/token.ts` and additionally matched the legacy `WA_TOKEN=` key, which the production detection chain (`detectProToken`) does not support. Removing the module eliminates the drift risk and the residual legacy alias. Token handling remains consolidated in `detectProToken` / `detectProTokenSync` (`$WEBAWESOME_NPM_TOKEN` → `~/.npmrc` → `.env` with `WEBAWESOME_NPM_TOKEN`). (F-011)

### Migration

- **Strict mode adoption may surface previously-silent typos.** If `kigumi status` (or any command) now reports `Unrecognized key(s): X`, that key was being dropped silently before; remove it (or fix the typo) to restore the prior behaviour. `kigumi upgrade` will not auto-fix these — by design.
- **Configs that explicitly omit `utilsDir` / `stylesDir` continue to work.** `mergeWithDefaults` still injects defaults from `DEFAULT_CONFIG` before strict validation runs, so on-disk configs only need framework, typescript, componentsDir, and theme to load successfully.
- **Pre-Cluster-B legacy keys are silently tolerated.** Configs initialised with kigumi <= 0.19.x carry `aliases` at the top level and may carry `webAwesome.cdnUrl`; both fields were removed in Cluster B and previously eaten by Zod's strip behaviour. With strict mode they would now fail validation. Instead, `mergeWithDefaults` strips `aliases` and `webAwesome.cdnUrl` before validation, so existing starter projects keep working without a manual edit. New typos still fail loudly.
- ### Breaking Changes
- **Angular and Vue: imperative methods removed from Dialog, Drawer, and Markdown wrappers (F-143).** WA 3.5.0+ marks `wa-dialog` / `wa-drawer` `show()`+`requestClose()` and `wa-markdown` `getMarked()`+`updateAll()` as `privacy: 'private'` in the CEM, so they are no longer exposed on the framework wrappers. All three framework wrappers (React/Angular/Vue) now converge on the WA-recommended attribute pattern. **Migration:** - **Angular:** replace `dialogComponent.show()` with `[open]="isOpen"` (and `requestClose()` with `[open]="false"`). Same for `wa-drawer`. For `wa-markdown`, replace `getMarked()` / `updateAll()` calls with re-binding the projected source content; `renderMarkdown()` remains public. - **Vue:** replace `dialogRef.value.show()` with `<Dialog v-model:open="isOpen">` (and `requestClose()` with `isOpen.value = false`). Same for `<Drawer>`. For `<Markdown>`, drop calls to `getMarked()` / `updateAll()`; `renderMarkdown()` remains exposed via `defineExpose`.
  The wrapper JSDoc carries an `@remarks` block pointing to the replacement API in every affected file.
  If your project has `src/types/web-awesome.d.ts` from an older Kigumi version, run `npx kigumi doctor` to confirm it is the obsolete one, then delete it. The official Web Awesome types in `src/vite-env.d.ts` (or `src/web-awesome.d.ts` for Next.js) cover every `wa-*` element.
- ### Changed
- **Templates are now real framework source files, not Handlebars templates.** Every `.tsx.hbs`, `.jsx.hbs`, `.vue.hbs`, `.test.tsx.hbs`, `.component.ts.hbs`, etc. has been renamed to its non-`.hbs` counterpart. Tier substitution moved from `Handlebars.compile()` to a single `String.replaceAll(/@awesome\.me\/webawesome(?!-pro)/g, packageName)` call inside `materializeTemplate()`. End-user output is byte-identical: `kigumi add`, `kigumi update`, and `kigumi init` produce the exact same files as before. The change is internal to the rendering pipeline and to the contributor-side tooling (`tsc` and `eslint` now cover `templates/**`, so authoring mistakes fail at PR time instead of on user machines).

## [Unreleased]

### Added

- **Cluster R: real-world starter e2e**: New `starters` CI matrix runs the post-`kigumi add` install path against the four pinned `kigumi-ui` starter repos (react, vue, angular, next) on every PR. Each lane installs the packed CLI tarball, runs `kigumi add` for the curated 9-component set, snapshot-diffs the emitted output against `tests/fixtures/starter-snapshots/`, then runs the starter's own `pnpm typecheck` and `pnpm build`.
- **Snapshot harness**: `tests/e2e/starter-snapshots.test.ts` walks `componentsDir + utilsDir + stylesDir` of a real starter and asserts every emitted file via vitest's `toMatchFileSnapshot`. Drift fails CI without an explicit `--update` commit.
- **Bulk-update helper**: `pnpm run update:starter-snapshots` regenerates fixtures across all four starters using tmp copies of each clone (skipping `node_modules` and `.git`); the user's local clones are never mutated.
- **Per-PR pack-test**: `pack-test` job in `ci.yml` (shipped in #140) packs the CLI tarball, installs it into a scratch directory, and asserts `kigumi init` + `kigumi add` produce the expected wrapper file. Catches packaging regressions before release.
- **Migration fixture suite**: `tests/fixtures/migration/{0.18.x,0.19.x}-config.json` plus `tests/integration/migration.test.ts` (shipped in #139) prove `kigumi upgrade --yes` keeps producing schema-valid configs as the schema evolves.

### Changed

- CI surface: `.github/workflows/ci.yml` gains a `starters` job (4-lane matrix, `fail-fast: false`) sequenced after `pack-test` and before `docs-typecheck`. The four matrix lanes resolve their starter SHA via `${{ vars[format('STARTER_{0}_REF', matrix.framework_upper)] }}` and clone the public `kigumi-ui` starter repos without authentication.
- `tsconfig.tests.json`: excludes `tests/fixtures/starter-snapshots/**` so `pnpm check:tests` does not type-check fixture files (they are starter output, not kigumi-cli source).

## [0.19.2] - 2026-04-11

### Fixed

- **Tier gating**: Pro components no longer leak to Free tier in `kigumi add` and `kigumi list`; `isComponentAvailable()` now reads `component.tier` from the registry directly instead of a hardcoded list that had drifted
- **`kigumi list`**: Pro components are dimmed with a `(Pro)` badge on Free tier; added `cwd` option and `tier` field to JSON output
- **`layers.css` migration**: New `surgicalRewriteLayersCss` helper rewrites only the `@import` lines during tier switch, preserving user customizations; `migration.ts` reads paths from config instead of hardcoded defaults
- **`kigumi doctor`**: Scans `config.stylesDir` for stale package references as a recovery path; fixed global regex `lastIndex` bug that silently skipped every other file in multi-file scans; fixed false-positive diagnostics when CSS comments mention the wrong package
- **Error codes**: `LayersCssRewriteError` now uses `MIGRATION_PARSE_ERROR` (405) instead of `FILE_WRITE_ERROR` (402)

## [0.19.1] - 2026-04-05

### Added

- **Angular skills**: `kigumi-angular` conversion skill with 11 evals, Angular reference patterns for all 4 compose skills (form, layout, overlay, data)
- **Skills publishing**: `scripts/publish-skills.mjs` extracts skill publishing to a standalone script with centralized whitelist; `evals/` directories excluded from published output
- **Angular on docs site**: AgentSkills page and skills README list `kigumi-angular`

### Fixed

- **Angular templates**: RadioGroup and Select `invalid` @Input/@Output collision renamed to `invalidEvent`; generator now detects @Input name collisions
- **Skill references**: Corrected `(waSelect)` to `(select)` event binding, replaced raw `<wa-divider>` with `<k-divider />`, fixed 9 bare boolean attributes across Angular reference files, removed invalid `closable`/`(close)` on Callout
- **AGENTS.md**: Synced all 4 files with codebase, added validation script, documented skills publishing pipeline

## [0.19.0] - 2026-04-04

### Added

- **Web Awesome 3.5.0**: Upgrade dependency from ^3.4.0 to ^3.5.0
- **Markdown**: New free component (experimental)
- **Page**: Moved from Pro to Free tier
- **Combobox**: New props allow-create, autocapitalize, autocorrect, enterkeyhint, inputmode, spellcheck and wa-create event
- **ColorPicker**: New placement prop
- **Textarea**: New with-count prop
- **Rating**: Now form-associated with name and required props
- **Angular**: Host attribute forwarding and AfterViewInit lifecycle for all 74 components

### Changed

- **Combobox**: Removed deprecated autocomplete prop (upstream breaking change)

### Fixed

- **Templates**: Resolved pre-existing type errors across React, Vue, and Angular via starter repo testing
- **Templates**: Angular prop sync and Markdown getMarked instance fix
- **Templates**: NumberInput Vue JS variant uses numeric fallback (val ?? 0) instead of string

## [0.18.3] - 2026-03-29

### Fixed

- **Installer**: Auto-retry npm install on ERESOLVE peer dependency conflicts

## [0.18.2] - 2026-03-27

### Fixed

- **upgrade**: Fix Web Awesome dependency not being bumped during `kigumi upgrade`. The installer now passes the target WA version from config to the package manager (e.g. `pnpm add @awesome.me/webawesome@^3.4.0`) instead of installing without a version specifier.
- **version-map**: Fix patch releases (e.g. 0.18.1) not resolving a version entry. `getVersionEntry()` now falls back to the highest entry `<=` the requested version, so patch releases inherit the WA version from their minor release.
- **installer**: Auto-retry with `--legacy-peer-deps` when npm fails with ERESOLVE peer-dependency conflicts during install.

## [0.18.1] - 2026-03-27

### Fixed

- **Dialog/Drawer templates**: Fix TS2352 compilation error with WA 3.4.0. The `show`/`requestClose` methods are now private in WA's type definitions; use `Omit` to strip conflicting keys before re-declaring them as public for imperative use.

## [0.18.0] - 2026-03-26

### Breaking Changes

- **Input**: `autocorrect` prop type changed from `'off' | 'on'` (string union) to `boolean`
- **Slider**: `required` prop removed (WA 3.4.0 dropped the attribute)

### Added

- **Web Awesome 3.4.0**: Upgrade internal WA dependency from ^3.3.1 to ^3.4.0
- **CLI update notification**: Show a notification when a newer CLI version is available on npm (cached 24h, skipped in CI and non-TTY)

### Fixed

- **React templates**: Add explicit `WaElement | null` type to ref callback parameter for strict-mode compatibility
- **version-map**: Fix kigumiVersion entry to match actual release version (was incorrectly set to 0.13.0)
- **lint-staged**: Scope eslint to `{src,tests,scripts}/**` so docs/ uses its own config
- **Chromatic CI**: Add `--stats-json` to Storybook build for TurboSnap compatibility

## [0.17.2] - 2026-03-25

### Fixed

- **React templates**: Use WaElement type import for React 19 ref compatibility. Templates now import the actual WA element type, use `useRef<WaElement | null>`, and pass a callback ref matching the WA JSX type signature
- **Vue templates**: Use WaElement type, remove all `as any` casts from `defineExpose` methods, and remove unused `defineEmits` from no-event components
- **Vue init**: Write Vue type references to `src/env.d.ts` instead of `compilerOptions.types` array in `tsconfig.app.json`. Includes `vite/client` reference for CSS module support

### Changed

- **Init options**: Remove unused `--tier` flag from CLI. Tier is detected from package.json dependencies and `.env` token

## [0.17.1] - 2026-03-19

### Fixed

- **Docs**: Replace Shoelace-era token names with correct Web Awesome API names in theme.css comments, README examples, and generated output (e.g. `--wa-color-brand-600` to `--wa-color-brand-60`, `--wa-font-family-sans` to `--wa-font-family-body`)
- **Init**: Fix output saying "Import Web Awesome" instead of "Import Kigumi"
- **Update**: Create snapshot for `no-snapshot-match` status so future three-way merges work correctly
- **Update**: Fix conflict status formatting (misplaced closing parenthesis)

## [0.17.0] - 2026-03-17

### Fixed

- **Init**: Preserve `installedComponents` when re-running `kigumi init`, preventing config from being wiped on re-initialization
- **Upgrade**: Auto-install components listed in config during `kigumi upgrade` if they are missing from the project

## [0.16.0] - 2026-03-16

### Added

- **`kigumi update` command**: Three-way merge update workflow that intelligently merges upstream template changes with your local component modifications
- **"New" badges**: Sidebar and Welcome page cards now display "New" badges for recently added components

### Changed

- **Welcome page**: Refreshed layout, enhanced card structure, and clearer content
- **Roadmap board**: Updated visual styling for improved consistency
- **Documentation**: Added monorepo setup guide, restructured sidebar navigation, expanded troubleshooting FAQs, and added roadmap page with kanban board

## [0.15.1] - 2026-03-15

### Added

- **Community Registries**: Add Community Registries section to documentation with link from Banner component
- **Component Grid images**: Update Storybook component grid with preview images for all components

### Changed

- **Storybook layout**: Change story canvas layout from centered to padded for improved presentation
- **Story organisation**: Refine story tags and exclude VueGuide from Storybook navigation

## [0.15.0] - 2026-03-13

### Added

- **v-model support**: Vue SFC templates now use `defineModel()` for two-way binding on form controls (`Input`, `Select`, `Checkbox`, `Switch`, `Slider`, etc.) and overlay open state (`Dialog`, `Drawer`, `Dropdown`)
- **Component-specific events**: Each Vue template forwards its Web Awesome events (e.g. `wa-input`, `wa-change`, `wa-show`, `wa-hide`) instead of only generic `wa-blur`/`wa-focus`
- **Named slots**: Vue templates expose all component slots (`header`, `footer`, `label`, `prefix`, `suffix`, etc.)
- **Vue project scaffolding**: `kigumi init` now configures Vite plugin and tsconfig paths for Vue projects
- **New docs**: Vue Guide page, Customize page, framework-aware code blocks in Getting Started

### Fixed

- **JSON parser**: Replaced regex-based `stripJSONComments` with a state-machine parser that no longer corrupts glob patterns like `src/**/*.ts` in tsconfig files

### Changed

- **Style stories**: All 6 Style category stories converted from `.stories.tsx` to MDX format

## [0.14.0] - 2026-03-12

### Breaking Changes

- **Node 18 deprecated**: Minimum supported Node.js version is now Node 20. CI no longer tests against Node 18
- **Setup file renamed**: Generated setup file renamed from `webawesome.ts` to `kigumi.ts`. Associated functions renamed (`regenerateWebAwesomeSetup` to `regenerateKigumiSetup`, `updateWebAwesomeImports` to `updateKigumiImports`). Update your import path from `@/lib/webawesome` to `@/lib/kigumi`

### Added

- **`--json` output**: `kigumi status` and `kigumi list` now accept a `--json` flag for CI/CD-friendly machine-readable output
- **`--verbose` global flag**: Enables debug logging and command timing ("Done in 1.2s" on stderr)
- **Storybook documentation**: New Style, Layout, and Design Tokens categories with comprehensive utility class and token reference docs
- **Pro/Experimental badges**: Storybook sidebar now shows Pro and Experimental badges for Web Awesome component stories
- **Chromatic visual regression**: CI now runs Chromatic snapshot tests on pull requests
- **Unit tests**: ~350 new tests across 20 test files covering brand, palette, theme, init, framework-detection, diff, upgrade, registry, and more
- **CI improvements**: 10 parallel jobs, dependency license check, npm pack dry-run, smoke test before publish

### Fixed

- **URLs**: Fix broken double-protocol URLs (`https://https://`) in add/validator, init/index, init/installer
- **Status**: Fix `--json` intro banner leaking into JSON output
- **Init**: Fix post-init next steps not showing (switched from `output.log()` to `output.info()`)
- **Error handling**: Fix 29 silent catch blocks across 19 files
- **Post-build**: Fix script referencing removed `skills/` directory
- **Config**: Fix `loadConfig` incorrectly awaited in status and theme/show commands

### Changed

- **Quality audit**: Consolidated `KigumiConfig` type, replaced unsafe `as Error` casts, added `ConfigInvalidError`, consolidated GitHub URLs into constants, escalated ESLint rules
- **Build system**: `tsup.config.ts` with source maps, `scripts/post-build.ts` replacing fragile shell commands
- **Templates**: Handlebars `precompile()` content validation added to template validation script
- **Coverage thresholds**: Raised to 68/57/77/68 (lines/branches/functions/statements)
- **Dependencies**: Bumped `@eslint/js`, `@types/node`, and various production/development dependencies. Updated pnpm from 10.28.2 to 10.29.3

## [0.13.0] - 2026-03-07

### Added

- **Version pinning**: Projects now track the Kigumi CLI version via `kigumiVersion` in `kigumi.config.json`
- **`kigumi upgrade` command**: Shows migration guide when project version differs from CLI version (breaking changes, WA version changes, affected components, recommended actions)
- **`kigumi diff` command**: Compares installed component files against current templates to see what changed before running `--force`
- **Version mismatch behavior**: Minor mismatch shows warning; major mismatch shows hard error with instructions to pin or upgrade
- **Provenance tracking**: Each installed component records its `kigumiVersion` in `installedComponents`

## [0.12.0] - 2026-03-07

### Added

- **Web Awesome 3.3.1**: Upgrade from 3.2.1 to 3.3.1
- **Chart component** (Pro): Bar, line, pie, doughnut, and other chart types
- **Toast component** (Pro): Non-blocking notification containers
- **ToastItem component** (Pro): Individual notification items
- **Data Display category**: New components added to Storybook overview grid

### Changed

- **Badge templates**: Updated with start/end slot documentation
- **Popup CSS template**: Added `--popup-border-width` custom property
- **QrCode**: Added CSS styling alternative documentation
- **Component metadata**: Regenerated (73 components from custom-elements.json)

### Fixed

- **Metadata generation**: Prefer newest Web Awesome version

## [0.11.0] - 2026-03-05

### Added

- **`kigumi registry connect <url>`**: Connect a community registry to your project
- **`kigumi registry list`**: List connected registries
- **`kigumi registry remove <name>`**: Remove a connected registry
- **`kigumi registry init`**: Scaffold a new community registry
- **`kigumi registry validate`**: Validate registry structure
- **`kigumi registry add-component`**: Add a component entry to registry.json
- **`kigumi registry add-theme`**: Add a theme entry to registry.json
- **`kigumi add --from <source>`**: Install components from a community registry (accepts URL or connected name)
- **`kigumi theme install --from <source>`**: Install themes from a community registry
- **Name-based registry lookup**: `--from` accepts saved registry names (e.g. `--from mischa-dev`) in addition to full URLs

### Fixed

- **Type declarations**: Now include `class?: string` on all `wa-*` elements
- **Community themes**: Correctly import from local `community-themes/` directory instead of Web Awesome package path

## [0.10.0] - 2026-02-28

### Added

- **Storybook integration**: Component stories and documentation
- **Type declarations**: Added for `wa-file-input`, `wa-number-input`, `wa-sparkline`
- **Registry props**: Added missing props for ColorPicker, Combobox, Dropdown, DropdownItem, IntersectionObserver, Popover, Radio, RadioGroup, Rating, Scroller, Select, TabGroup, Tooltip

### Changed

- **Templates**: Clean up Dialog and Drawer (remove duplicate jsx/tsx files), fix Divider layout, improve Button and ColorPicker CSS

## [0.9.2] - 2026-02-19

### Changed

- **React events**: Replace `wa-` events with native events

## [0.9.1] - 2026-02-18

### Changed

- **Dialog/Drawer**: Add data attributes for declarative usage, improve open/close handling, and update examples

## [0.9.0] - 2026-02-15

### Added

- **Kigumi Studio**: Theme editor on documentation site
- **Landing page**: New design with announcement banner
- **setup:npmrc script**: Token configuration for development

### Fixed

- **Pro token**: Fix Web Awesome Pro token URL in generated .env file

### Changed

- **Documentation**: Improved Getting Started and Troubleshooting with Pro token guidance

## [0.8.2] - 2026-02-10

### Added

- **CI**: Automatic GitHub release creation in workflow

### Fixed

- **Build**: Prevent unnecessary regeneration of metadata files
- **@clack/prompts**: Fix API compatibility after update

### Changed

- **Dependencies**: Update @clack/prompts to 1.0.0, commander to 14.0.3, execa to 9.6.1, GitHub Actions (checkout v6, codecov v5)

## [0.8.1] - 2026-02-10

### Fixed

- **Release process**: Fix release and clean up generated files from validation/transformation scripts

## [0.8.0] - 2026-02-10

### Breaking Changes

- **React events**: Event props renamed from `onWa*` to `on*` across 35 components (e.g. `onWaShow` to `onShow`, `onWaHide` to `onHide`)
- **Vue events**: Emitted events renamed from `wa-*` to simplified names across 35 components (e.g. `@wa-show` to `@show`)

### Added

- **Tooltip**: `for` property to target elements by ID
- **Validation**: `scripts/validate-components.ts` for registry validation
- **Migration**: `scripts/transform-event-names.ts` for automated event renaming

## [0.7.0] - 2026-02-09

### Added

- **Unit tests**: 75+ new tests for error handling and component commands
- **Validation scripts**: Automated checks for changes, registry, and templates
- **CI workflows**: Coverage reporting and security auditing

### Fixed

- **Validation scripts**: 3 critical bugs fixed

### Changed

- **Web Awesome**: Dependency updated to 3.2.1
- **Add command**: Improved TypeScript type narrowing

## [0.6.1] - 2026-02-09

### Fixed

- **CI build**: Prebuild script skips gracefully when docs dependencies are unavailable
- **README**: Corrected og-image URL

## [0.6.0] - 2026-02-09

### Added

- **Vue.js support**: Initialize a Kigumi project with Vue 3 (`npx kigumi init` and select Vue 3) and generate Vue-friendly component wrappers

## [0.5.0] - 2026-02-08

### Breaking Changes

- **Agent skill renamed**: `transform-webawesome-to-react` renamed to `kigumi-react` following `kigumi-{purpose}` convention

### Added

- **`kigumi-theme` skill**: Theme customization guidance (CSS variables, dark mode, design tokens)

## [0.4.4] - 2026-02-07

### Fixed

- **Vercel deployment**: Restore missing `__CLI_VERSION__` declaration in docs build
- **Vercel**: Fix `ERR_INVALID_THIS` errors during pnpm install
- **TypeScript**: Fix compilation errors for `__CLI_VERSION__`

### Changed

- **Docs**: Convert to pnpm lockfile for consistency with root project
- **Vercel**: Pin Node.js to 22, add `.vercelignore` for optimized uploads

## [0.4.3] - 2026-02-07

### Fixed

- **Installer**: Fix broken installer

## [0.4.2] - 2026-02-07

### Changed

- **npm package**: Add README.md and update homepage to kigumi.style

## [0.4.1] - 2026-02-07

### Changed

- **README**: Improved documentation

## [0.4.0] - 2026-02-07

### Added

- **Pro token detection**: Fallback chain from `$WEBAWESOME_NPM_TOKEN` env var to `~/.npmrc` to `.env` file
- **CSS Cascade Layers**: New `layers.css` provides predictable CSS specificity control via `@layer` rules
- **`--no-install` flag**: Skip dependency installation during init
- **File preservation**: Re-running `kigumi init` preserves customized `theme.css` and `layers.css`
- **CI test matrix**: Node 18/20/22 x npm/pnpm/yarn
- **Integration tests**: Added for init command

### Changed

- **Error messages**: Better guidance when Pro token is missing
- **CLI output**: Clearer setup instructions for Pro tier
- **README**: Streamlined with simplified Pro setup guide

## [0.3.0] - 2026-01-29

### Added

- **Page component** (Pro): React templates with imperative methods support, CSS template with all 17 CSS parts documented

## [0.2.2] - 2026-01-29

### Changed

- **CLI output**: Hide debug messages behind `DEBUG` env variable, simplify dependency installation output, consistent capitalization for themes/palettes/brand colors, improved post-install instructions

## [0.2.1] - 2026-01-29

### Changed

- **README**: Simplified, removed unnecessary sections
