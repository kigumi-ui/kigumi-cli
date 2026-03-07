# Source Code Guide

> CLI source code for Kigumi - extends [root AGENTS.md](../AGENTS.md)

## Directory Structure

```
src/
├── index.ts              # CLI entry (Commander.js routing)
├── constants.ts          # Magic strings, regex patterns, WA version
├── commands/             # CLI command handlers
│   ├── init/             # Project initialization
│   ├── add/              # Component installation
│   │   ├── index.ts              # Main add logic (built-in + remote branching)
│   │   ├── validator.ts          # Validate component exists, tier access
│   │   ├── component-selector.ts # Interactive component picker (built-in)
│   │   ├── installer.ts          # Copy templates, run transforms
│   │   ├── remote-installer.ts   # Download + install from GitHub (no Handlebars)
│   │   └── remote-component-selector.ts  # Interactive picker (community)
│   ├── theme.ts          # Theme command group (set + install)
│   ├── theme/
│   │   └── install.ts    # Install community themes from registry
│   ├── registry.ts       # Registry command group
│   ├── registry/         # Community registry management
│   │   ├── init.ts       # Scaffold new registry
│   │   ├── validate.ts   # Validate registry.json
│   │   ├── add-source.ts # Connect registry URL to config (registry connect)
│   │   ├── list-sources.ts # List connected registries
│   │   ├── remove-source.ts # Remove registry from config
│   │   ├── add-component.ts # Add component entry to registry.json
│   │   └── add-theme.ts  # Add theme entry to registry.json
│   ├── doctor.ts         # Diagnose/fix imports + version alignment
│   ├── status.ts         # Project status
│   ├── upgrade.ts        # Version upgrade guide + config update
│   ├── diff.ts           # Compare components against current templates
│   └── ...
├── utils/                # Business logic
│   ├── registry.ts       # Component definitions (SOURCE OF TRUTH)
│   ├── tier.ts           # Tier detection from .env
│   ├── tier-restrictions.ts
│   ├── config.ts         # kigumi.config.json handling
│   ├── template.ts       # Handlebars rendering
│   ├── regenerate.ts     # Auto-generate webawesome.ts, theme.css
│   ├── json.ts           # JSON with comments support
│   ├── github-fetcher.ts # GitHub URL parsing + raw content fetch
│   ├── file-diff.ts      # Detect local modifications before overwriting
│   ├── version-check.ts  # CLI vs project version compatibility check
│   ├── version-map.ts    # Version history + breaking changes data
│   ├── registry-cache.ts # Disk cache for registry data (~/.kigumi/cache)
│   ├── github-token.ts   # GitHub PAT resolution chain
│   └── registry-resolver.ts # Resolve --from value (URL or saved name)
├── schemas/              # Zod validation schemas
│   ├── config.ts         # KigumiConfig schema
│   ├── options.ts        # Command options schemas
│   ├── community-registry.ts  # Community registry.json schema
│   └── ...
├── errors/               # Typed error classes
│   ├── community-registry.ts  # Registry-specific errors
│   ├── version.ts        # VersionMismatchError (exit code 7)
│   └── ...
├── output/               # Console formatting (@clack/prompts)
├── frameworks/           # Framework adapters (React, Vue, Svelte)
└── checks/               # Pre-flight validation
```

## Key Modules

### `utils/registry.ts` - Component Registry

**Single source of truth** for all Web Awesome components.

```typescript
export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  button: {
    name: 'Button',
    tagName: 'wa-button',
    importPath: '@awesome.me/webawesome/dist/components/button/button.js',
    tier: 'free',
  },
  // ... 73 components
};
```

**When adding components:** Update registry FIRST, then create templates.

### `utils/tier.ts` - Tier Detection

Detects tier from `.env` file, NOT from config.

```typescript
export async function detectTier(cwd: string): Promise<Tier> {
  const envPath = path.join(cwd, '.env');
  if (!(await fs.pathExists(envPath))) return 'free';

  const content = await fs.readFile(envPath, 'utf-8');
  const tokenMatch = content.match(/^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m);

  return tokenMatch && tokenMatch[1]?.length >= 10 ? 'pro' : 'free';
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

```typescript
interface KigumiConfig {
  framework: 'react' | 'vue' | 'svelte';
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

### `utils/regenerate.ts` - File Generation

Generates `webawesome.ts`, `layers.css`, `theme.css`, and `vite-env.d.ts`.

**Key Design Decisions:**

- **`layers.css`** (auto-generated): Wraps all Web Awesome imports in `@layer` for cascade control. Base layer (Web Awesome CSS) < theme layer (user custom CSS). Regenerated on every theme/brand/palette change.
- **`webawesome.ts`** (auto-generated): Imports layers.css and applies theme classes to `<html>`. Regenerated on every theme/brand/palette change.
- **`theme.css`** (user-editable): User's custom CSS overrides ONLY. Generated only on `init` if file doesn't exist, then preserved on subsequent inits.
- **`vite-env.d.ts`**: TypeScript declarations. Must use `declare global`, not `declare module 'react'`.

**When regenerated:**

- `layers.css` + `webawesome.ts`: All theme/brand/palette commands
- `theme.css`: Only `init` (if file doesn't exist)

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
const newTier = await detectTier(cwd); // from .env

if (previousTier !== newTier) {
  await migratePackageReferences(cwd, previousTier, newTier);
  await cleanupOldPackage(cwd, previousTier);
}
```

### `commands/add/`

| File                           | Responsibility                                       |
| ------------------------------ | ---------------------------------------------------- |
| `index.ts`                     | Orchestration (branches on `--from` for remote flow) |
| `validator.ts`                 | Validate component exists, tier access               |
| `component-selector.ts`        | Interactive component picker (built-in registry)     |
| `installer.ts`                 | Copy templates, run transforms, detect modifications |
| `remote-installer.ts`          | Download + install from GitHub (no Handlebars)       |
| `remote-component-selector.ts` | Interactive picker (community registry)              |

**Built-in flow:** Uses Handlebars templates + `ComponentInstaller`.
**Remote flow (`--from`):** Downloads pre-rendered files via `RemoteComponentInstaller`, resolves internal dependencies (topological sort), tracks provenance in `config.installedComponents`.

**Auto-import:** After adding component, `updateWebAwesomeImports()` adds:

```typescript
import '@awesome.me/webawesome/dist/components/{name}/{name}.js';
```

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

| Error Class                       | When Thrown                               |
| --------------------------------- | ----------------------------------------- |
| `CommunityRegistryNotFoundError`  | Repo or registry.json not found           |
| `CommunityRegistryInvalidError`   | Zod validation of registry.json failed    |
| `CommunityComponentNotFoundError` | Component key not in registry             |
| `FrameworkMismatchError`          | Registry doesn't support user's framework |
| `CircularDependencyError`         | Dependency cycle detected in resolution   |

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

---

**Parent:** [AGENTS.md](../AGENTS.md)
