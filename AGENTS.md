# Kigumi CLI - AI Agent Guide

> **shadcn/ui for Web Awesome** - Template-based CLI for React/Vue/Svelte wrappers around Web Awesome components.

**Status**: v0.2.0 Production Ready ✅ | **Framework**: TypeScript, Commander, Handlebars

## 🚨 Critical Rules

### 1. React Import Pattern

**TypeScript (.tsx files):**

```typescript
// ✅ Use named imports (Works with Vite 6 defaults)
import { forwardRef, useState, type HTMLAttributes } from 'react';
```

**JavaScript (.jsx files):**

```javascript
// ✅ Use default import (Standard for JavaScript)
import React from 'react';
const { useState } = React; // or React.useState()
```

**Why**: Named imports work with Vite 6's default `tsconfig`. The key is to NOT use `declare module 'react'` in type declarations (see Rule #16).

### 2. Templates-First Development

**NEVER edit generated code. ALWAYS update `.hbs` templates.**

```
Edit .hbs → pnpm build → Re-add with --overwrite → Test in browser
```

**Template System:**

- TypeScript: `.tsx.hbs` (with interfaces)
- JavaScript: `.jsx.hbs` (with JSDoc)
- Build copies templates to `dist/templates/`

### 3. Web Component Registration

Components MUST be imported in `src/lib/webawesome.ts`:

```typescript
import '@awesome.me/webawesome/dist/components/button/button.js';
```

Auto-managed by `updateWebAwesomeImports()` in `src/commands/add.ts`.

### 4. Use `class` NOT `className`

```typescript
// ✅ Web components use 'class'
<wa-button class={clsx('Button', className)}>

// ❌ className doesn't work
<wa-button className={className}>
```

### 5. Dialog API: `requestClose()` NOT `hide()`

```typescript
// ✅ Provide both (hide as alias)
hide: () => dialogRef.current?.requestClose();
requestClose: () => dialogRef.current?.requestClose();
```

### 6. Event Listeners in useEffect

```typescript
// ✅ Cleanup prevents memory leaks
React.useEffect(() => {
  const el = dialogRef.current;
  if (!el) return;
  el.addEventListener('wa-show', handleShow);
  return () => el.removeEventListener('wa-show', handleShow);
}, [onShow]);
```

### 7. Remove `wa-` Prefix from Props

```typescript
// Web Awesome events: wa-show, wa-hide
// React props: onShow, onHide (clean API)
```

### 8. Tier System (NEW ARCHITECTURE)

**Tier is detected from `.env`, NOT stored in config:**

```bash
# Free tier (no .env needed)
kigumi init --framework=react --theme=awesome

# Pro tier (token in .env)
kigumi init --framework=react --theme=brutalist --token=YOUR_TOKEN
```

**Key Points:**

- ✅ `.env` is source of truth: `WEBAWESOME_NPM_TOKEN` exists = Pro
- ✅ Config file (`kigumi.config.json`) has NO tier field
- ✅ `detectTier()` reads `.env` to determine tier
- ✅ `.npmrc` created for BOTH tiers (overrides global config)
  - Free: Points to public npm registry
  - Pro: Points to Cloudsmith with auth token
- ✅ Token NEVER stored in config or .env.example

**Tier Restrictions:**

- **Free**: 3 themes, ALL 9 palettes, most components
- **Pro**: 11 themes, ALL 9 palettes, ALL components
- **Pro-only**: page, charts, combobox, data-grid, date-picker, file-input, toast, video

### 9. Auto-Installation

`kigumi init` now installs dependencies automatically:

- No separate `kigumi install` needed
- `install` command deprecated (shows warning)
- Prompts user in interactive mode
- Always installs in non-interactive mode

### 10. Code Quality (ZERO TOLERANCE)

**Pre-commit hooks automatically enforce:**

- ✅ ESLint (0 errors, 0 warnings)
- ✅ Prettier (all files formatted)
- ✅ TypeScript type-check (0 errors)

**Commands:**

```bash
pnpm lint          # Must show: ✖ 0 problems
pnpm type-check    # Must show: no errors
pnpm format:check  # Must show: all files formatted
pnpm test          # Must show: all tests passing
pnpm build         # Must succeed with DTS generation
```

**Auto-fix:**

```bash
pnpm lint:fix      # Fix ESLint issues
pnpm format        # Format all code
```

### 11. Free → Pro Migration

When Pro token added to existing Free project:

```bash
kigumi init --token=YOUR_TOKEN
```

- Auto-detects tier upgrade
- Migrates all `@awesome.me/webawesome` → `@awesome.me/webawesome-pro`
- Updates `.npmrc` to Pro registry
- Creates `.env` with token
- Non-interactive mode: auto-migrates
- Interactive mode: asks user

### 12. Tier Migration Architecture (CRITICAL)

**Two-Tier Detection System:**

```typescript
// previousTier: What WAS installed (package-based)
async function detectPreviousTier(cwd: string): Promise<Tier> {
  const packageJson = await fs.readJSON('package.json');
  if (packageJson.dependencies?.['@awesome.me/webawesome-pro']) {
    return 'pro'; // Pro package was installed
  }
  return 'free';
}

// newTier: What SHOULD be installed (token-based)
async function detectTier(cwd: string): Promise<Tier> {
  const envPath = path.join(cwd, '.env');
  if (!(await fs.pathExists(envPath))) return 'free';

  const content = await fs.readFile(envPath, 'utf-8');
  const tokenMatch = content.match(/WEBAWESOME_NPM_TOKEN\s*=\s*(.+)/);

  return tokenMatch && tokenMatch[1].length >= 10 ? 'pro' : 'free';
}
```

**Migration Logic:**

```typescript
const previousTier = existingConfig ? await detectPreviousTier(cwd) : 'free';
const newTier = proToken ? 'pro' : await detectTier(cwd);

if (previousTier === 'free' && newTier === 'pro') {
  // Free→Pro: Migrate @awesome.me/webawesome → @awesome.me/webawesome-pro
  await migratePackageReferences();
  await cleanupOldPackage('@awesome.me/webawesome');
}

if (previousTier === 'pro' && newTier === 'free') {
  // Pro→Free: Migrate @awesome.me/webawesome-pro → @awesome.me/webawesome
  await reverseMigratePackageReferences();
  await cleanupOldPackage('@awesome.me/webawesome-pro');
}
```

**Why This Matters:**

- ❌ OLD: `previousTier = detectTier(cwd)` → reads current `.env`, Pro→Free impossible
- ✅ NEW: `previousTier = detectPreviousTier(cwd)` → reads `package.json`, Pro→Free works!

**Critical Files:**

- `src/commands/init/index.ts` - Main migration logic (lines 34-53: `detectPreviousTier()`)
- `src/commands/init/migration.ts` - Migration functions (Free↔Pro)
- `src/commands/init/installer.ts` - Package cleanup (lines 111-153)

### 13. Path Aliases sind Automatisch (v0.2.0+)

**Automatisch konfiguriert**:

- `vite.config.ts`: Adds `resolve.alias['@']`
- `tsconfig.app.json`: Adds `baseUrl` and `paths`

**Idempotent**:

- Re-running init is safe
- Won't overwrite existing config

**User Action**: NONE REQUIRED

**Files Modified**:

- [`src/utils/path-aliases.ts`](src/utils/path-aliases.ts) - New utility
- [`src/commands/init/file-generator.ts`](src/commands/init/file-generator.ts) - Integration

### 14. Test-Dateien sind Conditional

**Nur generiert wenn**:

- Vitest ODER Jest installiert
- @testing-library/react installiert

**Grund**: Vermeidet TypeScript-Errors bei Projekten ohne Test-Setup

**Check-Logik**: `ComponentInstaller.checkTestSetup()`

### 15. JSON Parsing with Comments

Vite's `tsconfig.app.json` contains comments (invalid JSON). Use the helper function from `src/utils/json.ts`:

**Problem:**

```typescript
// ❌ Fails with "Expected double-quoted property name"
const tsconfig = await fs.readJSON(tsconfigPath);
```

**Solution:**

```typescript
// ✅ Strip comments before parsing
import { readJSONWithComments } from '@/utils/json';
const tsconfig = await readJSONWithComments(tsconfigPath);
```

**Helper Function** (`src/utils/json.ts`):

```typescript
export async function readJSONWithComments(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf-8');
  const stripped = content
    .replace(/\/\/.*/g, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
  return JSON.parse(stripped);
}
```

### 16. TypeScript Declarations: NEVER use `declare module 'react'` (CRITICAL)

**Root Cause of TypeScript Errors:**

Using `declare module 'react'` in `.d.ts` files **completely overwrites** the React module declaration, breaking all named imports like `useState`, `forwardRef`, etc.

**Problem:**

```typescript
// ❌ BREAKS React - overwrites the entire module!
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': React.DetailedHTMLProps<...>;
    }
  }
}
```

**Error:**

```
Module '"react"' has no exported member 'useState'.
Module '"react"' has no exported member 'forwardRef'.
```

**Solution:**

```typescript
// ✅ CORRECT - extends global JSX namespace without touching React
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

export {}; // Makes this a module
```

**Why this works:**

- `declare global` extends the global scope without overwriting anything
- React's own JSX types merge with our additions
- The `export {}` is required to make the file a module (otherwise `declare global` won't work)

**Files affected:**

- `templates/react/vite-env.d.ts.hbs` - MUST use `declare global`
- Any user-created `.d.ts` files - warn against `declare module 'react'`

**This was the root cause of ALL TypeScript issues in the CLI!**

## 🎯 Core Files

| File                                  | Purpose                                        |
| ------------------------------------- | ---------------------------------------------- |
| `src/utils/registry.ts`               | Component definitions (single source of truth) |
| `src/utils/tier.ts`                   | Tier detection from `.env`                     |
| `src/utils/tier-restrictions.ts`      | Tier validation logic                          |
| `src/utils/config.ts`                 | Config load/save (`kigumi.config.json`)        |
| `src/utils/regenerate.ts`             | Auto-generate webawesome.ts, theme.css, types  |
| `src/utils/json.ts`                   | **NEW**: JSON parsing with comment support     |
| `src/output/types.ts`                 | OutputInterface definition (includes warn())   |
| `src/commands/init/`                  | Initialization logic                           |
| `src/commands/init/config-builder.ts` | Build config (no tier stored)                  |
| `src/commands/init/file-generator.ts` | Generate project files                         |
| `src/commands/init/installer.ts`      | Install dependencies                           |
| `src/commands/init/migration.ts`      | Free↔Pro migration                             |
| `src/commands/add.ts`                 | Add components + auto-imports                  |
| `templates/react/{Component}/`        | Handlebars templates                           |
| `tests/e2e/`                          | End-to-end smoke tests                         |
| `tests/unit/`                         | Unit tests for utilities                       |

## ⚡ Quick Commands

```bash
# Build & Test
pnpm build
pnpm test          # Run unit tests (fast)
pnpm test:e2e      # Run E2E tests (slow, real environment)

# Test Free tier
node dist/index.js init --framework=react --theme=awesome --yes

# Test Pro tier
node dist/index.js init --framework=react --theme=brutalist --token=TOKEN

# Test Migration
node dist/index.js init --token=TOKEN  # In existing Free project

# Add components
node dist/index.js add button --overwrite
```

## 🐛 Debugging

| Problem             | Check                                      | Fix                                  |
| ------------------- | ------------------------------------------ | ------------------------------------ |
| Components unstyled | `webawesome.ts` imports?                   | Run `updateWebAwesomeImports()`      |
| TypeScript errors   | `declare module 'react'`?                  | Use `declare global` instead!        |
| wa-\* type errors   | `vite-env.d.ts` exists?                    | Run `generateViteEnvDts()`           |
| Theme not applying  | CSS imported? HTML classes?                | Check `theme.css`                    |
| Tier wrong          | `.env` has token?                          | Use `detectTier()`                   |
| Registry mismatch   | `.npmrc` correct?                          | Delete `node_modules` + lockfile     |
| Free→Pro fails      | Migration ran?                             | Check `migration.ts`                 |
| React exports fail  | Any `.d.ts` with `declare module 'react'`? | Delete it or fix to `declare global` |

## 📝 Component Template Pattern

**Simple Component:**

```typescript
import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '{{{importPath}}}';

export const {{name}} = forwardRef<HTMLElement, {{name}}Props>(
  ({ className, ...props }, ref) => (
    <wa-{{tag-name}} ref={ref} class={clsx('{{name}}', className)} {...props} />
  )
);
```

**Complex Component (Dialog):**
See `templates/react/Dialog/Dialog.tsx.hbs` for:

- Event listeners in useEffect
- Custom events (onShow, onHide)
- Imperative methods via useImperativeHandle

## 🔄 Common Workflows

### Add New Component

1. Update `src/utils/registry.ts`
2. Create templates in `templates/react/{Component}/`:
   - `{Component}.tsx.hbs` (TypeScript with interfaces)
   - `{Component}.jsx.hbs` (JavaScript with JSDoc)
   - `{Component}.test.tsx.hbs` and `.test.jsx.hbs`
   - `{Component}.css.hbs`
3. Use named imports from React: `import { forwardRef } from 'react'`
4. Add TypeScript declarations in `templates/react/vite-env.d.ts.hbs`
5. Test: `pnpm build && node dist/index.js add {component}` (both TS and JS projects)

### Fix Component Bug

1. Edit `.hbs` template (NOT generated code)
2. Rebuild: `pnpm build`
3. Regenerate: `node dist/index.js add {component} --overwrite`
4. Test in browser

### Add Theme/Palette

1. Update `TIER_RESTRICTIONS` in `src/utils/tier-restrictions.ts`
2. Test: `node dist/index.js theme set {theme}`

## ⚠️ Common Mistakes

1. ❌ Editing generated code instead of `.hbs` templates
2. ❌ Mixing React import styles (use named in `.tsx`, default in `.jsx`)
3. ❌ Using `className` on `<wa-*>` elements
4. ❌ Working with assumptions instead of proper research
5. ❌ Event listeners in ref callback (use useEffect)
6. ❌ Not testing in browser
7. ❌ Writing excessive unit tests (false positives)
8. ❌ Storing tier in config (use `.env` detection)
9. ❌ Forgetting `.npmrc` for Free tier (needed to override global)
10. ❌ **`any` is NEVER an option**. Use `unknown`, proper types, or generics
11. ❌ If unsure, ask for help - don't make assumptions
12. ❌ **Pre-commit hooks enforce code quality** - see Section 10
13. ❌ Using `fs.readJSON()` on files with comments (use `readJSONWithComments()`)
14. ❌ **Using `declare module 'react'` in .d.ts files** - BREAKS React! Use `declare global` instead (see Rule #16)

## 🧪 Testing Checklist

### Functional Testing

- [ ] Test Free tier in browser (`node dist/index.js init --framework=react --theme=awesome`)
- [ ] Test Pro tier in browser (`node dist/index.js init --framework=react --theme=brutalist --token=TOKEN`)
- [ ] Test Free→Pro migration (add token to existing Free project)
- [ ] **Test Pro→Free downgrade** (remove `.env`, re-run init with Free theme)
- [ ] Test component addition (`node dist/index.js add button`)

### Tier Migration Testing (Critical)

**Setup Test Projects:**

```bash
# Create test projects in tests/ folder
npm create vite@latest tests/test-free-install -- --template react-ts
npm create vite@latest tests/test-pro-install -- --template react-ts
```

**Free→Pro Upgrade Test:**

```bash
cd tests/test-free-install
# 1. Init with Free tier
node ../../dist/index.js init --framework=react --theme=awesome
# 2. Verify: Only @awesome.me/webawesome in package.json
cat package.json | grep webawesome
# 3. Add Pro token
echo "WEBAWESOME_NPM_TOKEN=your_token" > .env
# 4. Re-init with Pro theme
node ../../dist/index.js init --framework=react --theme=brutalist
# 5. Verify migration:
#    - 6 files migrated (components + generated files)
#    - Only @awesome.me/webawesome-pro in package.json
#    - Old package removed
```

**Pro→Free Downgrade Test:**

```bash
cd tests/test-pro-install
# 1. Init with Pro tier
node ../../dist/index.js init --framework=react --theme=brutalist --token=TOKEN
# 2. Verify: Only @awesome.me/webawesome-pro in package.json
cat package.json | grep webawesome
# 3. Remove token
rm .env
# 4. Re-init with Free theme
node ../../dist/index.js init --framework=react --theme=awesome
# 5. Verify reverse migration:
#    - 6 files reverse migrated
#    - Only @awesome.me/webawesome in package.json
#    - Old Pro package removed
```

**Key Verification Points:**

- ✅ `detectPreviousTier()` uses `package.json`, NOT `.env`
- ✅ Component imports updated (`webawesome` ↔ `webawesome-pro`)
- ✅ Old package cleaned up after migration
- ✅ Only one package remains in dependencies

### Testing Strategy (Pragmatic Approach)

**✅ Integration Tests Work (After Fixes):**

- Use `readJSONWithComments()` for Vite configs with comments
- Tests verify tier migrations, package cleanup, file generation
- Run with `pnpm test` (all tests should pass)
- Located in `tests/integration/tier-migrations.test.ts`

**✅ E2E Testing (Automated):**

1. Run `pnpm test:e2e` to execute smoke tests
2. Creates temporary Vite projects, runs CLI commands, verifies output
3. Tests both Free and Pro tier workflows
4. Use `--yes` flag for non-interactive mode in CI

**When to Use Each Approach:**

- Unit tests: Pure functions, utilities, validators
- Integration tests: Tier migrations, config generation, package management
- Manual tests: CLI commands, file generation, UX flows
- Browser tests: Component rendering, styling, interactions

### Browser Verification

- [ ] No console errors in DevTools
- [ ] TypeScript works (no red squiggles in IDE)
- [ ] Components render with styles
- [ ] Event handlers fire correctly
- [ ] Theme classes applied to `<html>` element

## 🔧 Key Implementation Details

### Tier Detection (`src/utils/tier.ts`)

```typescript
export async function detectTier(cwd: string): Promise<Tier> {
  const envPath = path.join(cwd, '.env');
  if (!(await fs.pathExists(envPath))) return 'free';

  const content = await fs.readFile(envPath, 'utf-8');
  const tokenMatch = content.match(/^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m);

  return tokenMatch && tokenMatch[1] && tokenMatch[1].length >= 10
    ? 'pro'
    : 'free';
}
```

### Config Structure (`kigumi.config.json`)

```json
{
  "framework": "react",
  "typescript": true,
  "componentsDir": "src/components/ui",
  "utilsDir": "src/lib",
  "theme": {
    "selected": "awesome",
    "palette": "default",
    "brandColor": "purple"
  },
  "webAwesome": {
    "version": "^3.1.0"
    // NO tier field - detected from .env
  }
}
```

### .npmrc Management

```bash
# Free tier
@awesome.me:registry=https://registry.npmjs.org/

# Pro tier
@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro
//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${WEBAWESOME_NPM_TOKEN}
```

### Auto-Generated Files

- `src/lib/webawesome.ts` - Component imports
- `src/styles/theme.css` - Theme CSS
- `src/vite-env.d.ts` - TypeScript declarations (React only)
- `.env` - Pro token (Pro only)
- `.npmrc` - Registry config (both tiers)

## 🎬 Getting Started

1. Read Critical Rules (top 10)
2. Scan Debugging table
3. Build: `pnpm build`
4. Test: `cd tests/react1 && pnpm dev`
5. Reference templates:
   - Simple: `templates/react/Button/`
   - Complex: `templates/react/Dialog/`

## 🎯 Questions Before Changes

1. Does this need `.hbs` template changes?
2. Works with React 18 AND 19?
3. Tier restrictions correct?
4. TypeScript errors for users?
5. Web components need imports?
6. Event listeners cleaned up?
7. Tested in browser?
8. Does tier detection work correctly?

---

## 🔄 Recent Changes & Bug Fixes

### TypeScript Root Cause Fix (2026-01-22)

**Critical Bug Fixed:**

The persistent "Module 'react' has no exported member" errors were caused by using `declare module 'react'` in type declarations.

**Root Cause:**

```typescript
// ❌ This OVERWRITES React's module declaration!
declare module 'react' {
  namespace JSX { ... }
}
```

**Solution:**

```typescript
// ✅ This EXTENDS the global JSX namespace
declare global {
  namespace JSX { ... }
}
export {};
```

**Files Changed:**

- `templates/react/vite-env.d.ts.hbs` - Now uses `declare global`
- `src/commands/add/index.ts` - Updated regex for new format
- `KIGUMI_SETUP.md.hbs` - Simplified (no manual steps needed)

**Result:** TypeScript works out-of-the-box with Vite 6 + React 19. No manual configuration needed!

### Tier Migration Improvements (2026-01-11)

**Fixed Bugs:**

1. **Bug #2 - Pro→Free Downgrade Not Working** ✅ FIXED
   - **Problem**: `previousTier` was detected from current `.env`, making downgrade impossible
   - **Solution**: Created `detectPreviousTier()` that checks `package.json` dependencies
   - **Files Changed**: [src/commands/init/index.ts:34-53](src/commands/init/index.ts#L34-L53)
   - **Test Result**: ✅ Successfully downgrades Pro→Free, migrates 6 files, removes Pro package

2. **Bug #1 - Component Migration Free→Pro** ✅ FIXED (Previous Session)
   - Components now properly migrate during tier upgrades
   - All user components + generated files updated

3. **Bug #3 - Package Cleanup** ✅ FIXED (Previous Session)
   - Old packages now properly removed after migration
   - Only one Web Awesome package remains in dependencies

**New Features:**

1. **Phase 2: Duplicate Package Warning** ✅ IMPLEMENTED
   - Warns when both `webawesome` and `webawesome-pro` are installed
   - Suggests removing Free package to reduce bundle size
   - **Files**: [src/commands/init/index.ts:59-85](src/commands/init/index.ts#L59-L85)

2. **Phase 3: Enhanced 401 Error Handling** ✅ IMPLEMENTED
   - Context-aware error messages for authentication failures
   - Provides clear instructions to obtain Pro token
   - **Files**: [src/commands/init/installer.ts:90-108](src/commands/init/installer.ts#L90-L108)

3. **Phase 4: Theme Validation** ✅ IMPLEMENTED
   - Blocks Pro themes (brutalist, glossy, etc.) without valid token
   - Shows helpful error with Free theme alternatives
   - **Files**: [src/commands/init/config-builder.ts:46-59](src/commands/init/config-builder.ts#L46-L59)

4. **Phase 5: Status Command** ✅ IMPLEMENTED
   - New `kigumi status` command shows project information
   - Displays: tier, framework, TypeScript, theme config, token status
   - Lists all installed components
   - Warns about duplicate packages and tier mismatches
   - **Files**: [src/commands/status.ts](src/commands/status.ts) (NEW), [src/index.ts:8,54-57](src/index.ts#L54-L57)

5. **Phase 6: Component Warning** ✅ IMPLEMENTED
   - Warns when adding Pro-only component without token
   - Shows helpful message before error (lets npm handle 401)
   - No pre-validation - adapts to Web Awesome changes automatically
   - **Files**: [src/commands/add/validator.ts:54-61](src/commands/add/validator.ts#L54-L61)

**Testing Results:**

All tests performed with real Vite projects in `tests/` folder:

| Test Scenario          | Files Migrated | Package State         | Status     |
| ---------------------- | -------------- | --------------------- | ---------- |
| Free→Pro Upgrade       | 6 files ✓      | Only webawesome-pro ✓ | ✅ PASSING |
| Pro→Free Downgrade     | 6 files ✓      | Only webawesome ✓     | ✅ PASSING |
| Theme Validation       | N/A            | Blocks Pro themes ✓   | ✅ PASSING |
| Status Command (Free)  | N/A            | Shows correct info ✓  | ✅ PASSING |
| Status Command (Pro)   | N/A            | Shows correct info ✓  | ✅ PASSING |
| Status with Duplicates | N/A            | Shows warning ✓       | ✅ PASSING |
| Component Warning      | N/A            | Warns before error ✓  | ✅ PASSING |

**Files Migrated:**

- `src/lib/webawesome.ts`
- `src/styles/theme.css`
- `src/vite-env.d.ts`
- `src/components/ui/Button/Button.tsx`
- `src/components/ui/Card/Card.tsx`
- `src/components/ui/Dialog/Dialog.tsx`
- `src/components/ui/Input/Input.tsx`
- (+ any other user-added components)

---

**Last Updated**: 2026-01-22
**Maintained by**: AI Assistants
**Questions**: See `README.md` or ask user for help.
