# Source Code Guide

> CLI source code for Kigumi - extends [root AGENTS.md](../AGENTS.md)

## Directory Structure

```
src/
├── index.ts              # CLI entry (Commander.js routing)
├── constants.ts          # Magic strings, regex patterns
├── commands/             # CLI command handlers
│   ├── init/             # Project initialization
│   ├── add/              # Component installation
│   ├── theme.ts          # Theme switching
│   ├── status.ts         # Project status
│   └── ...
├── utils/                # Business logic
│   ├── registry.ts       # Component definitions (SOURCE OF TRUTH)
│   ├── tier.ts           # Tier detection from .env
│   ├── tier-restrictions.ts
│   ├── config.ts         # kigumi.config.json handling
│   ├── template.ts       # Handlebars rendering
│   ├── regenerate.ts     # Auto-generate webawesome.ts (theme imports), theme.css (custom CSS template)
│   └── json.ts           # JSON with comments support
├── schemas/              # Zod validation schemas
├── errors/               # Typed error classes
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
  // ... 40+ components
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

| File                    | Responsibility                         |
| ----------------------- | -------------------------------------- |
| `index.ts`              | Main add logic, webawesome.ts updates  |
| `validator.ts`          | Validate component exists, tier access |
| `component-selector.ts` | Interactive component picker           |
| `installer.ts`          | Copy templates, run transforms         |

**Auto-import:** After adding component, `updateWebAwesomeImports()` adds:

```typescript
import '@awesome.me/webawesome/dist/components/{name}/{name}.js';
```

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
