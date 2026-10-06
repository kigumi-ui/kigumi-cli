# Source Code Guide

> CLI source code for Kigumi - extends [root AGENTS.md](../AGENTS.md)

## Directory Structure

```
src/
├── index.ts              # CLI entry (Commander.js routing)
├── constants.ts          # Magic strings, regex patterns, WA version
├── commands/             # CLI command handlers
│   ├── add.ts            # Add command entry
│   ├── init.ts           # Init command entry
│   ├── init/             # Project initialization
│   ├── add/              # Component installation
│   │   ├── index.ts              # Main add logic (built-in + remote branching)
│   │   ├── validator.ts          # Validate component exists, tier access
│   │   ├── component-selector.ts # Interactive component picker (built-in)
│   │   ├── installer.ts          # Copy templates, run transforms
│   │   ├── remote-installer.ts   # Download + install from GitHub (no template substitution)
│   │   └── remote-component-selector.ts  # Interactive picker (community)
│   ├── theme.ts          # Theme command group (set + install)
│   ├── theme/
│   │   ├── install.ts    # Install community themes from registry
│   │   ├── list.ts       # List available themes for current tier
│   │   └── show.ts       # Show current theme details
│   ├── registry.ts       # Registry command group
│   ├── registry/         # Community registry management
│   │   ├── init.ts       # Scaffold new registry
│   │   ├── validate.ts   # Validate registry.json
│   │   ├── add-source.ts # Connect registry URL or local path to config; downgrades framework mismatch to warning so consumers can later use --cross-framework
│   │   ├── list-sources.ts # List connected registries
│   │   ├── remove-source.ts # Remove registry from config
│   │   ├── add-component.ts # Add component entry to registry.json
│   │   └── add-theme.ts  # Add theme entry to registry.json
│   ├── doctor.ts         # Diagnose/fix imports + version alignment
│   ├── status.ts         # Project status (supports --json)
│   ├── list.ts            # List all available components (supports --json)
│   ├── upgrade.ts        # Version upgrade + dependency installation
│   ├── diff.ts           # Compare components against current templates (snapshot-aware)
│   ├── update.ts         # Three-way merge update for installed components; records the CLI version in installedComponents for each component it leaves at the current Templates
│   └── ...
├── utils/                # Business logic
│   ├── registry.ts       # Component definitions (SOURCE OF TRUTH)
│   ├── tier.ts           # Tier detection (package.json priority, token fallback)
│   ├── tier-restrictions.ts
│   ├── config.ts         # kigumi.config.json handling
│   ├── dependency-installer.ts # npm/pnpm install + old-package cleanup (shared by init and upgrade); brings .npmrc in line first; on Pro it passes the token (the one given, else the one found) to the package manager as WEBAWESOME_NPM_TOKEN and warns when the user's own installs will lack it; writes the exact Web Awesome version over an existing range first, since pnpm keeps a `^` despite --save-exact
│   ├── template.ts       # Template materialization (read + tier-swap)
│   ├── regenerate.ts     # Auto-generate kigumi.ts, theme.css
│   ├── json.ts           # JSON with comments support
│   ├── github-fetcher.ts # Registry source parsing + fetch — accepts GitHub URLs and local filesystem paths via the RegistrySource union (parseGitHubUrl, fetchFile, fetchRegistryJson all branch on source.kind)
│   ├── foreign-files-staging.ts # Stages source-framework files into .kigumi/foreign/<slug>/ with _meta.json for the kigumi-cross-framework skill (paired with kigumi add --cross-framework)
│   ├── diff-renderer.ts  # Colored unified diff for terminal (node-diff3)
│   ├── file-diff.ts      # Detect local modifications before overwriting
│   ├── snapshot.ts       # Snapshot CRUD for .kigumi/snapshots/ (three-way merge base; also saved for community --from installs); a save replaces the component's snapshot with exactly the files given
│   ├── three-way-merge.ts # Three-way merge logic using node-diff3
│   ├── version-check.ts  # CLI vs project version compatibility check
│   ├── version-map.ts    # Version history + breaking changes data (newest entry must match DEFAULT_WEBAWESOME_VERSION; see validate:wa-pins)
│   ├── registry-cache.ts # Disk cache for registry files (~/.kigumi/cache), keyed by owner-repo-branch, entries expire after REGISTRY_CACHE_TTL_MS
│   ├── installed-components.ts # Shared diff/update resolver — splits installed components into builtin (comparable against a template) and unmanaged (community or hand-written), so commands report them instead of skipping silently
│   ├── github-token.ts   # GitHub PAT resolution chain
│   ├── registry-resolver.ts # Resolve --from value (URL or saved name)
│   ├── display-options.ts # Theme/palette/brand display labels + tier-aware option helpers (getThemeOptionsForTier, getPaletteOptionsForTier)
│   ├── project-config.ts # Project configuration helpers (configureVueCustomElements, configureVueTypes)
│   ├── metadata-types.ts # Shared CEM-metadata interfaces (`ComponentMetadata`, `CSSPart`, `CSSCustomProperty`, `ComponentCSSMetadata`) owned by the parser; generated data files import and re-export them (issue #34)
│   ├── component-metadata.ts # Auto-generated component metadata (attributes, events, slots, methods) — data only; types live in metadata-types.ts
│   ├── detect-framework.ts # Framework, TypeScript, package manager, Next router, source-layout detection
│   ├── package-json.ts   # readDependencies: merged dependency map from the user's package.json for tier and project detection (missing -> {}, unreadable -> PackageJsonReadError, not a JSON object -> PackageJsonInvalidError)
│   ├── token.ts          # Pro token detection chain ($WEBAWESOME_NPM_TOKEN, user npmrc, .env): selects the tier, does not authenticate installs
│   ├── npmrc.ts          # Where npm and pnpm find the Pro token (user npmrc path, npm's auth-key walk, `${VAR}` expansion) and Kigumi's lines in the project .npmrc: writeProjectNpmrc() merges them and decides the ${WEBAWESOME_NPM_TOKEN} reference (issue #160)
│   ├── update-check.ts   # CLI update notification
│   └── registry/
│       └── types.ts      # Registry type definitions
├── schemas/              # Zod validation schemas
│   ├── config.ts         # KigumiConfig schema
│   ├── options.ts        # Command options schemas (addOptionsSchema includes crossFramework: boolean for --cross-framework)
│   ├── community-registry.ts  # Community registry.json schema
│   └── ...
├── errors/               # Typed error classes
│   ├── community-registry.ts  # Registry-specific errors
│   ├── filesystem.ts     # PackageJsonReadError, PackageJsonInvalidError (exit code 4)
│   ├── version.ts        # VersionMismatchError (exit code 7)
│   └── ...
├── output/               # Console formatting (delegates to prompts wrapper)
├── prompts/              # @clack/prompts wrapper + setPromptsForTesting() DI hook
└── checks/               # Pre-flight validation
```

### Two kinds of content under `src/`

Most of `src/` is CLI code: it runs when someone invokes `kigumi`. A few files are **template artifacts** that the CLI copies into a consumer's project and never executes itself:

| File                | What it is                                       |
| ------------------- | ------------------------------------------------ |
| `src/lib/kigumi.ts` | Setup module written into the consumer's project |
| `src/vite-env.d.ts` | Ambient types for the consumer's Vite project    |

Nothing in `src/` imports either one, which is expected rather than dead code. Searching for the import that "must" exist is wasted effort. The paths that reference them, such as `utils/regenerate.ts` and `commands/init/file-generator.ts`, are talking about the generated copy in the consumer's tree, not about these files.

## Key Modules

### `utils/registry.ts` - Component Registry

**Single source of truth** for all Web Awesome components.

```typescript
export const LOCAL_REGISTRY: ComponentRegistry = {
  button: {
    name: 'Button',
    tagName: 'wa-button',
    importPath: '@awesome.me/webawesome/dist/components/button/button.js',
    tier: 'free',
  },
  // ... 89 components
};
```

**When adding components:** Update registry FIRST, then create templates.

**Name normalization:** Use `normalizeComponentName(input)` to canonicalize a user-provided component name (kebab-case, PascalCase, or any mix) to the registry's stored `component.name`. The function always returns the registry's exact casing — callers get the same string used for directory names, snapshot paths, and `config.installedComponents` keys instead of reconstructing PascalCase from the kebab form and risking drift if the registry's canonical spelling ever changes. Returns `null` for unknown inputs.

**Dependency warnings:** When `kigumi add` runs locally, `ComponentInstaller.warnOnMissingDependencies()` walks each requested component's `dependencies` array and warns (does not auto-install) about any that are neither in the install list nor already present on disk. See `src/commands/add/installer.ts`.

**CSS metadata:** Auto-generated by `scripts/parse-custom-elements.ts` into `scripts/css-metadata.ts` (data) from types in `src/utils/metadata-types.ts`. Consumed only at build time by `scripts/generate-{angular,react,vue}-templates.ts` to seed parts / custom-property comments into the generated `.css` files. `pnpm validate:registry` emits warnings for registry entries without a corresponding `CSS_METADATA` entry.

**Attributes/events/slots/methods:** Not stored in the registry. Auto-generated by `scripts/parse-custom-elements.ts` into `src/utils/component-metadata.ts` (data; `ComponentMetadata` is declared once in `src/utils/metadata-types.ts`), consumed by build-time generators under `scripts/generate-*-templates.ts`. Attributes are reduced to a boolean-vs-string `type` (or omitted when the CEM lists no type, e.g. `did-ssr`) — just enough for the function harness (`tests/unit/react-function-harness.ts`, issue #74/#105) to pick a probe value; full enum values are not carried here. `pnpm validate:cem-sync` checks five things: registry ↔ CEM component-key coverage, **enum prop-value drift**, **attribute-name drift**, **deprecation drift**, and **default drift**.

**Enumerated booleans.** A registry prop may carry `keywords: { true, false }` (`ComponentProp` in `src/utils/registry/types.ts`) when Web Awesome reads it by value rather than presence: `spellcheck` (`"true"`/`"false"`) and `autocorrect` (`"on"`/`"off"`). All three generators then write `false` as its keyword instead of dropping it, and the prop takes no `default`; see `templates/AGENTS.md` rule 11. `tests/unit/enumerated-boolean-attributes.test.ts` fails when a prop the pin names lacks the keywords, or carries keywords the pin does not name (issue #101).

**Deprecated props.** A registry prop may carry `deprecated: '<what to do instead>'` (`ComponentProp`) when it is still accepted but should no longer be used: RadarChart's `stacked`, `grid`, `min` and `max`, which `WaChart` never applies to a radar chart (#129, removed in the next major by #130), and Icon's `auto-width` and QrCode's `fill` / `background`, which Web Awesome itself deprecates (in favour of `canvas="auto"` and the CSS `color` / `background-color` properties). The message is Kigumi's own wording, never copied from the CEM. The prop stays in every Template; `propJsdocLines()` in `scripts/generator-utils.ts` writes the message as a JSDoc `@deprecated` tag in all three generators, and the skill API surfaces print it as `min(number, deprecated)`. See `templates/AGENTS.md` rule 12 for how each surface states it. Removing a deprecated prop is a `major` changeset (`### Removed`). `tests/unit/deprecated-props.test.ts` proves a consumer's TypeScript reports the deprecation (React JSX, both Vue dialects) and fails when any Template, docs wrapper, `.jsx` typedef or story disagrees with the registry; `validate-cem-sync.test.ts` fails when an x/y axis attribute on a chart without x/y axes is offered as a working prop.

**Enum prop-value drift** diffs each registry `prop.values` enum against the live CEM attribute type (read directly from `custom-elements.json`, since the metadata file does not carry attribute enums). Registry values WA no longer accepts are errors; newly-added CEM values not yet surfaced (e.g. the WA 3.6.0 XS/XL/short-form `size` tokens) are warnings. Pre-existing intentional divergences live in `REGISTRY_VALUE_ALLOWLIST`. CEM components Kigumi deliberately does not wrap are listed in `INTENTIONALLY_UNWRAPPED` in `scripts/validate-cem-sync.ts` (the set is the source of truth; a passing run has zero warnings, a new unwrapped CEM component still warns, and an allowlist key that also has a registry entry is an error). Remove an entry there when adding its wrapper.

**Attribute-name drift** (issue #100) is the pure exported `checkAttributeDrift()` in `scripts/validate-cem-sync.ts`, table-tested in `tests/unit/validate-cem-sync.test.ts`. For every wrapped component it diffs the CEM's full attribute list against the registry's `props`, matching a registry prop to a CEM attribute by kebab-casing **both** names through `toKebabCase` (`src/utils/naming.ts`): `autoFocus` → `auto-focus`, and a Lit property the CEM lists under its camelCase name (`submenuOpen`) → `submenu-open`, so a prop of the same name still matches it. A CEM attribute with no matching prop and no allowlist entry is a warning — the same additive-drift treatment as a newly-added enum value; this is what would have caught `wa-dropdown-item`'s `href`/`target`/`rel`/`download` (added upstream in WA 3.12, fixed by hand in #85) instead of a follow-up patch. Two allowlists cover intentional gaps:

- `GLOBAL_ATTRIBUTE_ALLOWLIST` — attributes every custom element carries regardless of component: the inherited `dir`/`lang` and the SSR hydration marker `did-ssr`, plus (matched by a `with-*` prefix check, not a literal set) the SSR slot hints Web Awesome's DSD renderer writes.
- `COMPONENT_ATTRIBUTE_ALLOWLIST` — per-component entries, keyed by registry key then the **kebab-cased** attribute name (`submenu-open`, not `submenuOpen`), each tagged `backfill` (should be surfaced, but an open issue named in its reason owns that, e.g. a new attribute found by a Web Awesome bump; none today, since #101, #116 and #102 surfaced or triaged the whole 2026-09-24 baseline) or `intentional` (a caller cannot meaningfully set it from markup, e.g. function-, object- or element-typed values such as Rating's `getSymbol` and Popup's `flipBoundary`, and playback state; the component manages it internally, e.g. `role`/`tabindex` on `tab`/`tab-panel`/`tree`/`tree-item` and DropdownItem's `submenuOpen`; or the element ignores it, e.g. the x/y axis attributes pie, doughnut, polar-area and radar charts inherit from `WaChart`, filed under `INERT_ON_AXISLESS_CHART` (pie, doughnut: no scales) or `INERT_ON_RADIAL_CHART` (polar-area, radar: only a radial `r` scale), Carousel's `slides` / `currentSlide`, which nothing reads, and QrCode's `image-padding`, which qr-creator never applies) with a one-line reason. The ignored ones rest on Web Awesome's runtime, not its CEM, so a bump that starts honouring one cannot trip the check: the comments above the two constants and above `COMPONENT_ATTRIBUTE_ALLOWLIST` say what to re-check. Radar's `stacked`, `grid`, `min` and `max` are just as inert but are still registry props, `deprecated` since #129, so they have no entry; #130 removes them in the next major and files them here.

A per-component allowlist entry that no longer describes a gap is a **`stale-allowlist-entry` error** — the same discipline `allowlistedKeysInRegistry` applies to `INTENTIONALLY_UNWRAPPED`. That covers three cases: the registry now surfaces the attribute (backfilling a prop without deleting its entry fails the build), the CEM no longer declares it (removed upstream, or a key that is not kebab-cased and so can never match), and the entry's component is not in the registry. The validator's summary reports `Attribute drift` (warnings only; stale entries are listed under the errors) as a count separate from `Prop-value drift`, since one diffs attribute _names_ and the other diffs enum _values_ for props the registry already declares. Both CEM-dependent checks only run when a complete manifest was found (`assessCemCompleteness`); a passing run requires the Pro CEM (90 components) since the Free CEM alone omits 16 of the 89 registry components.

**Deprecation drift** (issue #133) is the pure exported `checkDeprecationDrift()` in `scripts/validate-cem-sync.ts`, table-tested in `tests/unit/validate-cem-sync.test.ts`. `parseCemAttributes()` carries each CEM attribute's `deprecated` field (a message, or a bare `true`; an empty message reads as `true`, since the string is only the reason, and `false` means not deprecated) next to the attribute types the other two manifest checks read. For every registry prop, matched to its CEM attribute kebab-cased on both sides as in attribute-name drift:

- The CEM deprecates the attribute and the registry prop has no `deprecated`: a **warning** (`deprecation-missing-from-registry`), additive drift like a new attribute. Mark the prop `deprecated` in Kigumi's own words and regenerate; this is what caught QrCode's `fill` / `background`.
- The registry prop is `deprecated` and the CEM attribute is not (or does not exist): an **error** (`deprecation-missing-from-cem`), unless `KIGUMI_DEPRECATIONS` records it as a Kigumi-side deprecation with a reason. The message tells the two cases apart, since an attribute Web Awesome removed needs a different fix from one Kigumi chose to deprecate, which is why `checkDeprecationDrift()` takes the whole `CemAttributes` (types and deprecations). RadarChart's `stacked`, `grid`, `min` and `max` are the entries today.
- A `KIGUMI_DEPRECATIONS` entry is a `stale-kigumi-deprecation` error (quoting its recorded reason) once its prop is no longer deprecated (or gone), once Web Awesome deprecates the attribute too, or when its component is not in the registry.

A CEM deprecation on an attribute with no registry prop is left to attribute-name drift, which already reports the missing prop. The summary reports `Deprecation drift` as its own count; `countDrift()` derives every per-kind count from the findings, and no stale entry of either kind counts as drift.

**Default drift** (issue #152) is the pure exported `checkDefaultDrift()` in `scripts/validate-cem-sync.ts`, table-tested in `tests/unit/validate-cem-sync.test.ts`. `parseCemAttributes()` also carries each CEM attribute's `default` as the manifest writes it. For every registry prop that states a `default`, matched kebab-cased as in the other checks, the registry default must name the same value as the element's: one pair of quotes goes on either side, `null` / `undefined` mean no default, and on a boolean `false` means no default too (absence already turns it off). A difference, or a registry default where the element states none, is an **error** (`default-drift`) unless `REGISTRY_DEFAULT_ALLOWLIST` records why; a stale entry there is a `stale-default-allowlist-entry` error. A prop without a registry default makes no claim, and one the CEM does not declare is left to the other checks. The registry default is what the skill surfaces and story tables document (`validate:stories` holds each argType's `defaultValue.summary` to it), and until #152 it was also what every `.js.vue` Template wrote on the host, which is how `size="medium"`, Button `appearance="filled"` and Slider's tooltip reached Vue JS users unnoticed.

### `utils/tier.ts` - Tier Detection

Detects tier from `package.json` (primary) with token fallback, NOT from config.

```typescript
export async function detectTier(cwd: string): Promise<Tier> {
  // 1. Check package.json first (installed package is source of truth)
  try {
    const installed = tierFromDependencies(await readDependencies(cwd));
    if (installed) return installed; // Pro package wins over Free
  } catch (error) {
    if (!(error instanceof PackageJsonInvalidError)) throw error;
  }

  // 2. Fallback to token detection ($WEBAWESOME_NPM_TOKEN, user npmrc, .env)
  const token = await detectProToken(cwd);
  return token ? 'pro' : 'free';
}
```

A missing `package.json`, a file that is not a JSON object (`PackageJsonInvalidError`: a syntax error, or valid JSON such as `null`), or one that lists neither Web Awesome package falls through to token detection. A file that cannot be read (permissions, a directory at that path) is thrown as `PackageJsonReadError` (`src/errors/filesystem.ts`, exit code 4): it names the file and suggests a fix matched to the errno code, instead of reaching `handleError` as an `UnknownError` that tells the user to report a Kigumi bug. The installed package wins over a token: the free package stays `'free'` even when `WEBAWESOME_NPM_TOKEN` is set.

The fix steps' shell commands (`chmod u+r package.json`) use the relative path on purpose. The CLI has no `--cwd` flag, so every command reads `package.json` from the directory it was run in; the absolute path is already in the message, and inside a command it wraps in the terminal box and can no longer be copied.

The read goes through `readDependencies` (`src/utils/package-json.ts`), which returns `dependencies` and `devDependencies` merged. A missing file is an empty map, since every caller treats "no package.json" as "no dependencies". Project detection in `detect-framework.ts` uses the same reader. That matters because `init` and `upgrade` call `getProjectInfo` before `detectTier`, and its first read (`detectFramework`) used to let the raw error through. Project detection does not catch `PackageJsonInvalidError`: `init` and `upgrade` cannot continue with a broken `package.json`, so they report it (exit code 4).

It is not the only reader of the file. `isNextProject` goes through it but swallows both errors on purpose and falls back to `next.config.*`. `status`, `init`'s `detectPreviousTier` / `checkDuplicatePackages` and `cleanupOldPackage` read the file directly but catch the error, and `doctor`'s version check runs after its `detectTier` call, so none of them can surface a raw fs error today. A new reader that can run before tier detection should use the helper.

**Detect before writing** (issue #121). A command that writes to the project resolves the tier (and, for `upgrade`, the project info) before its first write and passes it on. `regenerateKigumiSetup` and `generateComponent` take the tier as a required argument, and there is no `detectTierSync`, so no helper can detect behind a command's back after the command has written: the rule is enforced by the type checker, not by convention. `brand`, `palette`, `theme set`, `theme install`, `diff`, `update` and `add` detect up front with `detectTier`. A broken `package.json` then fails the command before anything changed. When `brand` and `theme install` left detection to `regenerateKigumiSetup`'s old `detectTierSync` fallback, they had already saved the config (and theme files) by the time it threw. Two related orderings follow the same rule: `upgrade` installs the new Web Awesome package before it saves the new version, so a failed install is retried on the next run instead of reported as "Already up to date", and `theme install` downloads every theme file before writing any.

### Pro Authentication

**Design Decision:** the project `.npmrc` declares how the package manager gets the Pro token and never holds a secret. `.env` selects the tier for Kigumi only.

npm and pnpm read the token from an npmrc. They never read `.env`, and a variable reaches them only through a reference in an npmrc. `utils/token.ts` finds a token to select the tier; `utils/npmrc.ts` knows where npm and pnpm look and owns Kigumi's lines in the project `.npmrc`.

| File | Purpose |
| --- | --- |
| `.npmrc` (project) | Registry line, plus on Pro a `//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${WEBAWESOME_NPM_TOKEN}` reference. No secret: commit it |
| `~/.npmrc` (or the file `npm_config_userconfig` names) | Auth token, when the user configured it there once |
| `.env` (project) | `WEBAWESOME_NPM_TOKEN` for tier detection only; `init --token` writes it |

**The reference rule.** `writeProjectNpmrc()` merges Kigumi's lines into the project `.npmrc` and keeps every other line. On Pro it adds the reference unless the user npmrc already gives npm the Pro token. It never replaces an auth line for the Pro registry that the project already has, and on Free it removes the reference it wrote. The reference is left out when the user npmrc holds the token because a project `_authToken` line takes precedence over the user npmrc. With the variable unset, npm would then send the literal `${WEBAWESOME_NPM_TOKEN}` (401), and pnpm would ignore the whole project `.npmrc` (`WARN Issue while reading ".../.npmrc". Failed to replace env in config: ${WEBAWESOME_NPM_TOKEN}`) and get a 404 from the public registry.

**Kigumi's own installs** (`init`, `upgrade`, init's reinstall) go through `installDependencies`. It brings `.npmrc` in line with the rule first, so a reinstall, or an `upgrade` that installs a new Web Awesome version, also repairs a registry-only `.npmrc` an older Kigumi wrote. On Pro it passes the package manager a token as `WEBAWESOME_NPM_TOKEN`: the one the user just gave (`init --token` or the prompt, the `token` option), else the one it found. Those installs authenticate whether the token came from the environment, the user npmrc or `.env`. The user's own installs and CI get no such help, so after a Pro install that had to pass the token because `.npmrc` reads the variable and the shell does not set it, the installer warns. With `init --no-install`, Next Steps says it instead. When pnpm cannot fill the reference it skips the whole `.npmrc` and gets a 404 from the public registry; the installer shows the token guidance for that as for a 401.

`init --token`, or the (masked) interactive prompt, saves the token to the project `.env` and references the variable from `.npmrc`. `generateGitIgnore` makes sure `.env` is ignored.

**Exception:** `docs/` has no committed `.npmrc`, so `docs/.npmrc` (gitignored, written by `pnpm run setup:npmrc`) carries its Pro registry line and the token; CI's docs jobs write only this file. Pnpm reads the global `~/.npmrc` auth line like npm does (checked with pnpm 10: a fresh Pro install succeeds with only that line and gets a 401 without it).

**User Setup:**

```bash
# Environment variable (recommended for shared projects and CI):
# shell profile, plus a CI secret
export WEBAWESOME_NPM_TOKEN=TOKEN

# Or the user npmrc, once per machine
npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken TOKEN
```

If the project `.npmrc` already reads `${WEBAWESOME_NPM_TOKEN}` (a teammate or CI set it up), the user npmrc token is not used there: set the variable.

### `utils/config.ts` - Config Management

Loads/saves `kigumi.config.json`. **Never stores tier** - always detected.

**Important:** `KigumiConfig` is defined once, in `src/schemas/config.ts` (Zod-inferred). `src/utils/config.ts` re-exports that same type, so either import path is correct.

**Lifecycle invariant:** load, validate, save are three honest operations:

- `loadConfig(cwd)` returns `{ config: unknown, filepath } | null` — the raw on-disk payload plus the discovered filepath. Pinned to `cwd` (no ancestor walk) so monorepo sub-packages cannot inherit a parent's config silently. Use only when you need access to the user's literal data (e.g. init's pre-flight safeParse).
- `getConfig(cwd)` calls `loadConfig`, then `mergeWithDefaults`. Throws `ConfigNotFoundError` when nothing is on disk and `ConfigInvalidError` (with formatted Zod issues) when the data fails strict validation. Use this almost everywhere.
- `saveConfig(patch, cwd)` is a patch primitive. It reads the on-disk file, merges only the keys in `patch` (one-level spread for `theme` and `webAwesome`), and writes back to the same filepath cosmiconfig discovered (so `.kigumirc`, `package.json#kigumi`, etc. round-trip correctly without creating a parallel `kigumi.config.json`). It throws `ConfigNotFoundError` when there is no on-disk file to patch.
- The write replaces the file in one step (`replaceFile`): a temporary file beside it, renamed over it, so a reader or an overlapping save sees the old file or the new one, never an empty or torn one (issue #171). It writes through a symlink to its target and keeps the file's permission bits. It does not serialize saves: two that overlap both read the same file, and the one that finishes last wins.

The schema is `.strict()`, so unknown keys (e.g. `framwork: 'react'`) raise `ConfigInvalidError` with `unrecognized_keys`. `kigumi upgrade` adds a one-line "remove the listed keys and re-run" hint before re-throwing so users see the remediation immediately.

```typescript
interface KigumiConfig {
  framework: 'react' | 'vue' | 'angular';
  typescript: boolean;
  componentsDir: string;
  utilsDir: string;
  theme: {
    selected: string;
    palette: string;
    brandColor: string;
  };
  webAwesome: {
    version: string;
    // NO tier field
  };
  // Community registry fields (all optional, backward-compatible)
  registries?: Array<{ url: string; name?: string }>;
  installedComponents?: Record<
    string,
    {
      source: 'builtin' | 'community';
      registryUrl?: string;
      registryVersion?: string;
      installedAt?: string;
    }
  >;
  installedThemes?: Record<
    string,
    {
      source: 'builtin' | 'community';
      registryUrl?: string;
      registryVersion?: string;
    }
  >;
}
```

### `utils/json.ts` - JSON with Comments

Vite's `tsconfig.app.json` contains comments. Use helper:

```typescript
import { readJSONWithComments } from '@/utils/json';

// Instead of fs.readJSON() which fails on comments
const tsconfig = await readJSONWithComments(tsconfigPath);
```

Uses a custom `stripJSONComments` state-machine parser (not regex) to correctly handle `//` and `/* */` comments inside strings. Avoids the `strip-json-comments` npm dependency.

### `utils/regenerate.ts` - File Generation

Generates `kigumi.ts`, `layers.css`, `theme.css`, `vite-env.d.ts`, and — for Next.js projects — `web-awesome.d.ts` via `generateNextEnvDts`.

**Key Design Decisions:**

- **`layers.css`** (auto-generated): Wraps all Web Awesome imports in `@layer` for cascade control. Base layer (Web Awesome CSS) < theme layer (user custom CSS). Regenerated on every theme/brand/palette change.
- **`kigumi.ts`** (auto-generated): Imports layers.css and applies theme classes to `<html>`. Regenerated on every theme/brand/palette change. For Next.js projects (`isNextProject(cwd)` returns true), `regenerateKigumiSetup` prepends `'use client';` so the `customElements.define` patch runs on the client.
- **`theme.css`** (user-editable): User's custom CSS overrides ONLY. Generated only on `init` if file doesn't exist, then preserved on subsequent inits.
- **`vite-env.d.ts`** / **`web-awesome.d.ts`**: TypeScript declarations for React+TS projects. Written once by `init` via `generateViteEnvDts()` / `generateNextEnvDts()` in `utils/regenerate.ts` — both emit a string literal that imports `CustomElements` and `CustomCssProperties` from the official Web Awesome package and augments `JSX.IntrinsicElements` with `declare global`. `add` does not touch these files; per-component prop types come straight from the WA package. Vite projects get `vite-env.d.ts` (with the `/// <reference types="vite/client" />` directive); Next.js projects get `web-awesome.d.ts` (no vite reference, Next owns `next-env.d.ts`). Vue+TS projects get `env.d.ts` via `configureVueTypes()` in `utils/project-config.ts`.

  All three follow the layout `detectSourceLayout()` reports: `src` layout writes into `src/`, root layout writes into the project root. Each creates the target directory before writing — `init` writes into directories it does not otherwise create, and hardcoding `src` here crashed root-layout React and Vue projects with ENOENT (issue #48). `configureVueTypes()` takes `sourceLayout` as an optional fourth parameter defaulting to `'src'`.

**When regenerated:**

- `layers.css` + `kigumi.ts`: All theme/brand/palette commands
- `theme.css`: Only `init` (if file doesn't exist)

### `utils/naming.ts` - Naming Conventions

Converts between PascalCase, kebab-case and camelCase. Used for Angular's lowercase file naming convention and tag name construction (`ButtonGroup` -> `button-group`), and by the three template generators to turn Web Awesome event names into per-framework handler names.

| Export | Direction |
| --- | --- |
| `toKebabCase()` | PascalCase -> kebab-case (`QRCode` -> `qr-code`) |
| `toPascalCase()` | kebab-case -> PascalCase (`after-hide` -> `AfterHide`) |
| `toCamelCase()` | kebab-case -> camelCase (`after-hide` -> `afterHide`) |
| `stripWaPrefix()` | drops a leading `wa-` from an event name |
| `toAngularOutputName()` | event -> Angular `@Output()` name (`blur` with a `blur()` method -> `blurEvent`) |

The two directions are not mirror images. `toKebabCase` has to decide where a run of capitals ends, so it carries a second replace: without it `QRCode` becomes `qrcode` rather than `qr-code` and silently misses every registry and metadata lookup keyed by the kebab name (issue #31). `toPascalCase` only joins parts already separated by hyphens, so it needs no such rule.

Generators build their distinct handler names on these primitives rather than re-deriving them: React `onAfterHide`, Vue `WaAfterHide`, Angular `afterHide`. Angular's whole `@Output()` rule lives here as `toAngularOutputName(event, taken)`: `input` always becomes `inputEvent`, and a name already taken by a public method or `@Input()` gets an `Event` suffix, since outputs share the class namespace. The Angular generator and the Angular function harness both call it, so the name a Template declares and the name the harness binds cannot drift apart (issue #77). Do not add a fifth casing helper to a generator; extend this module.

### `utils/template.ts` - Materialization + Extension Utilities

`materializeTemplate(path, packageName)` reads a template file from disk and applies the tier swap (`@awesome.me/webawesome` → `@awesome.me/webawesome-pro`) when the project is on Pro. For Free-tier projects it's a verbatim file read. There is no Handlebars layer; templates are real framework source files.

Also exports shared file extension helpers used by all commands:

- `getComponentExtension(framework, typescript)` - e.g. Angular: `component.ts`, Vue: `vue`, React: `tsx`
- `getFileBaseName(framework, componentName)` - Angular: kebab-case, others: PascalCase

`getTemplateFileNames(framework, componentName)` builds on them: the files one Template directory holds (each language variant plus CSS). No command imports it; `validate:templates` and `validate:registry` check `templates/` against it, and the generator output test holds each generator to it.

There is no test-file helper. `add`, `diff` and `update` handle the component file and its CSS only: the function harnesses in this repo prove the TypeScript Templates, so the CLI ships no per-component test and leaves any test a user wrote alone, snapshot or not (issue #80). A snapshot holds only the files the CLI manages: `saveSnapshot` removes what a save omits, and `update` keeps an earlier entry only for a file it still manages, so a test copied into `.kigumi/snapshots/` before #80 goes the next time that component's snapshot is saved.

**Next.js `'use client'` injection**: After `materializeTemplate()` resolves, `generateComponent` checks `isNextProject(cwd)` and prepends `'use client';\n\n` for React output. The 74 React templates stay framework-agnostic; the directive is a post-materialization transform, not a template concern (see `templates/AGENTS.md`).

### Next.js Detection

Next.js is treated as a React variant, not a separate framework enum. `framework: 'react'` stays in `kigumi.config.json`; the Next-specific branches read `isNextProject(cwd)` at call time.

Three detection helpers in `utils/detect-framework.ts` drive everything:

- `isNextProject(cwd)` — returns `true` when `next` appears in deps or a `next.config.{js,mjs,ts,cjs}` file is present. `getProjectInfo` surfaces the result as `ProjectInfo.isNext`.
- `detectNextRouter(cwd)` — returns `'app' | 'pages' | 'unknown'`. Looks for `app/` or `src/app/` first (App Router wins if both exist, matching Next's own precedence rule), then `pages/` or `src/pages/`, else `'unknown'`. `ProjectInfo.nextRouter` is only populated when `isNext` is true.
- `detectSourceLayout(cwd)` — returns `'src' | 'root'`. Used for **all** frameworks to decide whether Kigumi places files under `src/` or at the repo root, so the `@/*` alias resolves without rewriting the user's tsconfig.

Consumers:

- `detect-framework.ts` (`getProjectInfo`) — detects `react + react-dom + next` presence in deps and sets `isNext: true` on the returned `ProjectInfo`.
- `generateComponent` — prepends `'use client';` to React output when `isNextProject(cwd)`. Same directive for both routers: App Router needs it; Pages Router treats it as a harmless top-level string, so emitting uniformly keeps generated output consistent when a project migrates from Pages to App. **When `detectNextRouter(cwd) === 'pages'`, also strips the per-component `import './<Name>.css';` line** — Next's Pages Router rejects global CSS imports outside `pages/_app.tsx`, including transitively via components. Users add per-component stub CSS to `_app.tsx` manually if they customize it.
- `regenerateKigumiSetup` — prepends `'use client';` to `kigumi.ts` for the same reason. **When `nextRouter === 'pages'`, also omits the `import '<stylesAlias>/layers.css';` line** for the same Pages-Router CSS policy. An explanatory comment replaces the import so future readers understand why it's missing. Users add `layers.css` + `theme.css` directly to `_app.tsx` per post-install instructions.
- `generateNextEnvDts` — sibling of `generateViteEnvDts`; writes `web-awesome.d.ts` without the `vite/client` reference. Location follows `sourceLayout` (`src/` or root).
- `configureTSConfig(cwd, output, sourceLayout)` — tries `tsconfig.app.json` first, falls back to `tsconfig.json`. When adding a missing `@/*` alias, picks `['./src/*']` for the `src` layout and `['./*']` for the `root` layout so the generated directory structure and the path alias agree.
- `file-generator.ts` — skips `configureVitePathAliases` for Next; writes `providers.tsx` next to `app/` (either `app/providers.tsx` or `src/app/providers.tsx` depending on layout) **only** when `nextRouter !== 'pages'`. Pages Router projects get a post-install instruction pointing at `pages/_app.tsx` instead — their `_app.tsx` is user-owned.
- `config-builder.ts` — `getLayoutDefaults(projectInfo)` returns `componentsDir` / `utilsDir` / `stylesDir` matched to `sourceLayout`, so `create-next-app` without `--src-dir` gets `components/ui` / `lib` / `styles` at the repo root and the user's default `@/*: ['./*']` alias keeps working.
- `init/index.ts` — `showPostInstallInstructions` branches on `nextRouter`: App Router prints the `<KigumiProvider>` wrap snippet; Pages Router prints the `pages/_app.tsx` side-effect import; `'unknown'` falls through to App Router (modern Next default).
- `regenerate.ts` (`generateGitIgnore`) — adds `.kigumi/cache/` in addition to `.kigumi/foreign/`. `.kigumi/snapshots/` stays tracked because three-way merge depends on it. `.npmrc` is safe to commit: it holds no secret (see "Pro Authentication"). It also keeps `.env` ignored, because `init --token` writes the token there. The check follows gitignore semantics (the last matching pattern wins, `!` un-ignores), so a `.gitignore` that lists only `.env.local` does not count.

**Hydration contract**: all React templates emit `suppressHydrationWarning` on their `<wa-*>` host element. Lit reflects default attributes to the DOM during `connectedCallback`, producing a host-attribute delta on every component. `suppressHydrationWarning` is the documented React API for elements whose attributes mutate after hydration via a runtime (custom elements, date formatters, etc.). It suppresses one level only — children are still hydration-checked. In non-SSR contexts (Vite SPA) the attribute is a no-op, so shipping it uniformly is safe.

**Design choice:** branching on runtime flags keeps the schema stable for existing users and avoids duplicating 75 React component templates under a separate `templates/nextjs/` tree.

---

## Commands

### `commands/init/`

Modular initialization with separate concerns:

| File                | Responsibility                    |
| ------------------- | --------------------------------- |
| `index.ts`          | Orchestration, tier migration     |
| `config-builder.ts` | Build config from options/prompts |
| `file-generator.ts` | Generate project files            |
| `migration.ts`      | Free↔Pro package migration        |

Dependency installation is **not** here: `utils/dependency-installer.ts` holds `installDependencies` and `cleanupOldPackage`, because `upgrade` needs them too. Commands are leaf nodes and never import from a sibling command's directory; `kigumi/no-cross-command-import` enforces it.

**Tier Migration Flow:**

```typescript
const previousTier = await detectPreviousTier(cwd); // from package.json
const newTier = await detectTier(cwd); // package.json first, then token fallback

if (previousTier !== newTier) {
  await migratePackageReferences(cwd, config, output);
  await cleanupOldPackage(cwd, previousTier);
}
```

### `commands/add/`

| File | Responsibility |
| --- | --- |
| `index.ts` | Orchestration (branches on `--from` for remote flow) |
| `validator.ts` | Validate component exists, tier access |
| `component-selector.ts` | Interactive component picker (built-in registry) |
| `installer.ts` | Copy templates, run transforms, detect modifications |
| `remote-installer.ts` | Download + install from GitHub (no template substitution) |
| `remote-component-selector.ts` | Interactive picker (community registry) |

**Built-in flow:** Reads framework templates from `templates/<fw>/<Component>/` via `materializeTemplate` and copies via `ComponentInstaller`. **Remote flow (`--from`):** Downloads pre-rendered files via `RemoteComponentInstaller`, resolves internal dependencies (topological sort), tracks provenance in `config.installedComponents`. **Cross-framework flow (`--from <foreign> --cross-framework`):** When the registry's framework does not match the consumer project, `RemoteComponentInstaller` switches to `stageForeignComponent` (in `utils/foreign-files-staging.ts`) which writes the source-framework files into `.kigumi/foreign/<slug>/` along with a `_meta.json` (sourceFramework, targetFramework, registry provenance). `printSummary` then prints a "Convert with kigumi-cross-framework" hand-off block with the canonical Claude prompt. Component is marked `staged-for-conversion` in the install result and is NOT registered in `installedComponents`.

**Lazy component loading:** Generated wrappers register their WA component via a mount-triggered dynamic `import()` rather than a top-level side-effect import. Each component ships as its own webpack/rollup chunk, which bundlers can tree-shake away for routes that never render it. Power users needing eager loading (e.g., LCP-critical Button above the fold) can still add an explicit `import '@awesome.me/webawesome/dist/components/<name>/<name>.js';` to `src/lib/kigumi.ts`.

### `commands/registry/`

Community registry management:

| File               | Responsibility                                      |
| ------------------ | --------------------------------------------------- |
| `init.ts`          | Scaffold new registry (registry.json + dirs)        |
| `validate.ts`      | 6-check validation of registry.json                 |
| `add-source.ts`    | Connect registry URL to config (`registry connect`) |
| `list-sources.ts`  | List connected registries                           |
| `remove-source.ts` | Remove registry from config                         |
| `add-component.ts` | Add component entry to registry.json (for authors)  |
| `add-theme.ts`     | Add theme entry to registry.json (for authors)      |

### `utils/registry-resolver.ts` - Name-based Registry Lookup

Resolves `--from` value to a GitHub URL. Accepts either a full URL or a saved registry name from `config.registries`.

```typescript
// URL passthrough: contains '/' or '.'
resolveRegistrySource('https://github.com/user/reg', config); // → URL as-is

// Name lookup: plain string → search config.registries by name
resolveRegistrySource('mischa-dev', config); // → matched registry URL
```

Used by `commands/add/index.ts` and `commands/theme/install.ts`.

### `commands/theme/`

| File         | Responsibility                                   |
| ------------ | ------------------------------------------------ |
| `install.ts` | Install community theme from registry (`--from`) |
| `list.ts`    | List available themes for current tier           |
| `show.ts`    | Show current theme, palette, and brand color     |

---

## Error Handling

Use typed errors from `src/errors/`. **Never `throw new Error(...)` in `src/`** - `kigumi/no-raw-throw` enforces this. A raw Error reaches `handleError` as `UnknownError`, so it exits 1 whatever went wrong and loses its semantic code and suggestions.

```typescript
import {
  ConfigNotFoundError,
  ValidationError,
  InternalInvariantError,
} from '../errors/index.js';

// Throwing
throw new ConfigNotFoundError(cwd);

// A condition that is unreachable if the surrounding code is correct.
// This is a bug in Kigumi, not a mistake by the user, and says so.
if (!config) {
  throw new InternalInvariantError(
    'Configuration not loaded despite passing checks'
  );
}

// Catching
try {
  await loadConfig();
} catch (error) {
  if (error instanceof ConfigNotFoundError) {
    output.error(error.message);
    process.exit(error.exitCode);
  }
  throw error;
}
```

`ValidationError` takes an optional 5th argument that overrides its generic `"Validation failed for: <field>"` summary. Pass it whenever the caller can be more specific — the message is the line the user reads first.

**Community registry errors** (`src/errors/community-registry.ts`):

| Error Class | When Thrown |
| --- | --- |
| `CommunityRegistryNotFoundError` | Repo or registry.json not found |
| `CommunityRegistryInvalidError` | Zod validation of registry.json failed |
| `CommunityComponentNotFoundError` | Component key not in registry |
| `FrameworkMismatchError` | Registry doesn't support user's framework |
| `CircularDependencyError` | Dependency cycle detected in resolution |
| `PathTraversalError` | Local-source file path escapes the registry root |
| `RegistrySourceInvalidError` | Source URL unparseable, non-GitHub, or no owner/repo |
| `RegistryFetchError` | A registry file could not be read or fetched |

`CommunityComponentNotFoundError` takes a `kind` of `'component'` (default) or `'theme'`, since registries hold both.

**File system errors** (`src/errors/filesystem.ts`):

| Error Class | When Thrown |
| --- | --- |
| `PackageJsonReadError` | `package.json` exists but cannot be read (EACCES, EISDIR, ...); thrown by `readDependencies` in `utils/package-json.ts` |
| `PackageJsonInvalidError` | `package.json` is not a JSON object (syntax error, `null`, an array); same readers. Tier detection catches it and falls through to the token; project detection lets it reach the user |

---

## Schemas (Zod)

All user input validated with Zod schemas in `src/schemas/`:

```typescript
import { InitOptionsSchema, AddOptionsSchema } from '@/schemas';

const options = InitOptionsSchema.parse(rawOptions);
```

---

## Output Interface

Use `@/output` for consistent console output:

```typescript
import { createOutput } from '@/output';

const output = createOutput();
output.info('Installing dependencies...');
output.success('Done!');
output.warn('Pro theme requires token');
output.error('Failed to install');
```

`output.debug()` is **not** general-purpose printing. It is gated on `process.env.DEBUG`, so with DEBUG unset the message is discarded. Use `output.info()` for anything the user is meant to read.

---

## Code Style

- **No `any`** - use `unknown` or proper types
- **Named imports** from React in TypeScript
- **Path aliases** - use `@/` for `src/`
- **fs-extra** - use `fs-extra` not native `fs`
- **Async/await** - no callbacks or raw promises
- **WA utility classes**: Prefer `.wa-stack`, `.wa-grid`, `.wa-cluster`, `.wa-flank`, `.wa-frame`, `.wa-split` for layout compositions. See root AGENTS.md § CSS Utilities.

---

**Parent:** [AGENTS.md](../AGENTS.md)
