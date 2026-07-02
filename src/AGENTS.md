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
│   ├── update.ts         # Three-way merge update for installed components
│   └── ...
├── utils/                # Business logic
│   ├── registry.ts       # Component definitions (SOURCE OF TRUTH)
│   ├── tier.ts           # Tier detection (package.json priority, token fallback)
│   ├── tier-restrictions.ts
│   ├── config.ts         # kigumi.config.json handling
│   ├── template.ts       # Template materialization (read + tier-swap)
│   ├── regenerate.ts     # Auto-generate kigumi.ts, theme.css
│   ├── json.ts           # JSON with comments support
│   ├── github-fetcher.ts # Registry source parsing + fetch — accepts GitHub URLs and local filesystem paths via the RegistrySource union (parseGitHubUrl, fetchFile, fetchRegistryJson all branch on source.kind)
│   ├── foreign-files-staging.ts # Stages source-framework files into .kigumi/foreign/<slug>/ with _meta.json for the kigumi-cross-framework skill (paired with kigumi add --cross-framework)
│   ├── diff-renderer.ts  # Colored unified diff for terminal (node-diff3)
│   ├── file-diff.ts      # Detect local modifications before overwriting
│   ├── snapshot.ts       # Snapshot CRUD for .kigumi/snapshots/ (three-way merge base; also saved for community --from installs)
│   ├── three-way-merge.ts # Three-way merge logic using node-diff3
│   ├── version-check.ts  # CLI vs project version compatibility check
│   ├── version-map.ts    # Version history + breaking changes data
│   ├── registry-cache.ts # Disk cache for registry data (~/.kigumi/cache)
│   ├── github-token.ts   # GitHub PAT resolution chain
│   ├── registry-resolver.ts # Resolve --from value (URL or saved name)
│   ├── display-options.ts # Theme/palette/brand display labels + tier-aware option helpers (getThemeOptionsForTier, getPaletteOptionsForTier)
│   ├── project-config.ts # Project configuration helpers (configureVueCustomElements, configureVueTypes)
│   ├── component-metadata.ts # Auto-generated component metadata (events, slots, methods) — single source for CEM-derived data, used by template generator scripts
│   ├── detect-framework.ts # Framework, TypeScript, package manager, Next router, source-layout detection
│   ├── token.ts          # Pro token detection chain ($WEBAWESOME_NPM_TOKEN, ~/.npmrc, .env)
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
│   ├── version.ts        # VersionMismatchError (exit code 7)
│   └── ...
├── output/               # Console formatting (delegates to prompts wrapper)
├── prompts/              # @clack/prompts wrapper + setPromptsForTesting() DI hook
└── checks/               # Pre-flight validation
```

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
  // ... 80 components
};
```

**When adding components:** Update registry FIRST, then create templates.

**Name normalization:** Use `normalizeComponentName(input)` to canonicalize a user-provided component name (kebab-case, PascalCase, or any mix) to the registry's stored `component.name`. The function always returns the registry's exact casing — callers get the same string used for directory names, snapshot paths, and `config.installedComponents` keys instead of reconstructing PascalCase from the kebab form and risking drift if the registry's canonical spelling ever changes. Returns `null` for unknown inputs.

**Dependency warnings:** When `kigumi add` runs locally, `ComponentInstaller.warnOnMissingDependencies()` walks each requested component's `dependencies` array and warns (does not auto-install) about any that are neither in the install list nor already present on disk. See `src/commands/add/installer.ts`.

**CSS metadata:** Hand-maintained in `scripts/css-metadata.ts` and consumed only at build time by `scripts/generate-{angular,react,vue}-templates.ts` to seed parts / custom-property comments into the generated `.css` files. `pnpm validate:registry` emits warnings for registry entries without a corresponding `CSS_METADATA` entry.

**Events/slots/methods:** Not stored in the registry. Auto-generated by `scripts/parse-custom-elements.ts` into `src/utils/component-metadata.ts`, consumed by build-time generators under `scripts/generate-*-templates.ts`. `pnpm validate:cem-sync` checks two things: registry ↔ CEM component-key coverage, and **enum prop-value drift** — each registry `prop.values` enum is diffed against the live CEM attribute type (read directly from `custom-elements.json`, since the metadata file does not carry attribute enums). Registry values WA no longer accepts are errors; newly-added CEM values not yet surfaced (e.g. the WA 3.6.0 XS/XL/short-form `size` tokens) are warnings. Pre-existing intentional divergences live in `REGISTRY_VALUE_ALLOWLIST`.

### `utils/tier.ts` - Tier Detection

Detects tier from `package.json` (primary) with token fallback, NOT from config.

```typescript
export async function detectTier(cwd: string): Promise<Tier> {
  // 1. Check package.json first (installed package is source of truth)
  const pkg = await readJSON(join(cwd, 'package.json'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps['@awesome.me/webawesome-pro']) return 'pro';
  if (deps['@awesome.me/webawesome']) return 'free';

  // 2. Fallback to token detection ($WEBAWESOME_NPM_TOKEN, ~/.npmrc, .env)
  const token = await detectProToken(cwd);
  return token ? 'pro' : 'free';
}
```

### Pro Authentication

**Design Decision:** Pro tokens are stored in global `~/.npmrc`, not per-project.

| File                | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `.npmrc` (project)  | Registry URL only (can be committed to git)    |
| `~/.npmrc` (global) | Auth token (user configures once)              |
| `.env` (project)    | `WEBAWESOME_NPM_TOKEN` for tier detection only |

**Exception:** For `docs/` (pnpm), the token must also be in `docs/.npmrc` – pnpm does not use global auth for scoped registries. Written by `pnpm run setup:npmrc`.

**Why global:**

- Token not exposed in project repository
- Configure once, works for all projects
- Standard npm/pnpm best practice

**User Setup:**

```bash
npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken TOKEN
```

### `utils/config.ts` - Config Management

Loads/saves `kigumi.config.json`. **Never stores tier** - always detected.

**Important:** Import `KigumiConfig` type from `src/schemas/config.ts` (Zod-inferred, complete), NOT from `src/utils/config.ts` (old interface, missing `installedThemes` etc.).

**Lifecycle invariant:** load, validate, save are three honest operations:

- `loadConfig(cwd)` returns `{ config: unknown, filepath } | null` — the raw on-disk payload plus the discovered filepath. Pinned to `cwd` (no ancestor walk) so monorepo sub-packages cannot inherit a parent's config silently. Use only when you need access to the user's literal data (e.g. init's pre-flight safeParse).
- `getConfig(cwd)` calls `loadConfig`, then `mergeWithDefaults`. Throws `ConfigNotFoundError` when nothing is on disk and `ConfigInvalidError` (with formatted Zod issues) when the data fails strict validation. Use this almost everywhere.
- `saveConfig(patch, cwd)` is a patch primitive. It reads the on-disk file, merges only the keys in `patch` (one-level spread for `theme` and `webAwesome`), and writes back to the same filepath cosmiconfig discovered (so `.kigumirc`, `package.json#kigumi`, etc. round-trip correctly without creating a parallel `kigumi.config.json`). It throws `ConfigNotFoundError` when there is no on-disk file to patch.

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
- **`vite-env.d.ts`** / **`web-awesome.d.ts`**: TypeScript declarations for React+TS projects. Written once by `init` via `generateViteEnvDts()` / `generateNextEnvDts()` in `utils/regenerate.ts` — both emit a string literal that imports `CustomElements` and `CustomCssProperties` from the official Web Awesome package and augments `JSX.IntrinsicElements` with `declare global`. `add` does not touch these files; per-component prop types come straight from the WA package. Vite projects get `vite-env.d.ts` (with the `/// <reference types="vite/client" />` directive); Next.js projects get `web-awesome.d.ts` (no vite reference, Next owns `next-env.d.ts`).

**When regenerated:**

- `layers.css` + `kigumi.ts`: All theme/brand/palette commands
- `theme.css`: Only `init` (if file doesn't exist)

### `utils/naming.ts` - Naming Conventions

Converts between PascalCase and kebab-case. Used for Angular's lowercase file naming convention and tag name construction (`ButtonGroup` -> `button-group`).

### `utils/template.ts` - Materialization + Extension Utilities

`materializeTemplate(path, packageName)` reads a template file from disk and applies the tier swap (`@awesome.me/webawesome` → `@awesome.me/webawesome-pro`) when the project is on Pro. For Free-tier projects it's a verbatim file read. There is no Handlebars layer; templates are real framework source files.

Also exports shared file extension helpers used by all commands:

- `getComponentExtension(framework, typescript)` - e.g. Angular: `component.ts`, Vue: `vue`, React: `tsx`
- `getTestExtension(framework, typescript)` - e.g. Angular: `component.spec.ts`, Vue: `test.ts`, React: `test.tsx`
- `getFileBaseName(framework, componentName)` - Angular: kebab-case, others: PascalCase

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
- `regenerate.ts` (`generateGitIgnore`) — adds `.kigumi/cache/` in addition to `.kigumi/foreign/`. `.kigumi/snapshots/` stays tracked because three-way merge depends on it. `.npmrc` is safe to commit (registry URL only, no token).

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
| `installer.ts`      | npm/pnpm install, package cleanup |
| `migration.ts`      | Free↔Pro package migration        |

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

| File                           | Responsibility                                            |
| ------------------------------ | --------------------------------------------------------- |
| `index.ts`                     | Orchestration (branches on `--from` for remote flow)      |
| `validator.ts`                 | Validate component exists, tier access                    |
| `component-selector.ts`        | Interactive component picker (built-in registry)          |
| `installer.ts`                 | Copy templates, run transforms, detect modifications      |
| `remote-installer.ts`          | Download + install from GitHub (no template substitution) |
| `remote-component-selector.ts` | Interactive picker (community registry)                   |

**Built-in flow:** Reads framework templates from `templates/<fw>/<Component>/` via `materializeTemplate` and copies via `ComponentInstaller`.
**Remote flow (`--from`):** Downloads pre-rendered files via `RemoteComponentInstaller`, resolves internal dependencies (topological sort), tracks provenance in `config.installedComponents`.
**Cross-framework flow (`--from <foreign> --cross-framework`):** When the registry's framework does not match the consumer project, `RemoteComponentInstaller` switches to `stageForeignComponent` (in `utils/foreign-files-staging.ts`) which writes the source-framework files into `.kigumi/foreign/<slug>/` along with a `_meta.json` (sourceFramework, targetFramework, registry provenance). `printSummary` then prints a "Convert with kigumi-cross-framework" hand-off block with the canonical Claude prompt. Component is marked `staged-for-conversion` in the install result and is NOT registered in `installedComponents`.

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

Use typed errors from `src/errors/`:

```typescript
import { ConfigError, TierError, ValidationError } from '@/errors';

// Throwing
throw new ConfigError('Config file not found', { path: configPath });

// Catching
try {
  await loadConfig();
} catch (error) {
  if (error instanceof ConfigError) {
    output.error(error.message);
    process.exit(1);
  }
  throw error;
}
```

**Community registry errors** (`src/errors/community-registry.ts`):

| Error Class                       | When Thrown                                      |
| --------------------------------- | ------------------------------------------------ |
| `CommunityRegistryNotFoundError`  | Repo or registry.json not found                  |
| `CommunityRegistryInvalidError`   | Zod validation of registry.json failed           |
| `CommunityComponentNotFoundError` | Component key not in registry                    |
| `FrameworkMismatchError`          | Registry doesn't support user's framework        |
| `CircularDependencyError`         | Dependency cycle detected in resolution          |
| `PathTraversalError`              | Local-source file path escapes the registry root |

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

**Last Updated:** 2026-07-02 (Web Awesome 3.10.0; 80 components after adding random-content)
