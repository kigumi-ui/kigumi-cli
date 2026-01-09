# Kigumi CLI - AI Agent Guide

> **shadcn/ui for Web Awesome** - Template-based CLI for React/Vue/Svelte wrappers around Web Awesome components.

**Status**: Production Ready ✅ | **Framework**: TypeScript, Commander, Handlebars

## 🚨 Critical Rules

### 1. React Import Pattern
```typescript
// ✅ ALWAYS USE
import React from 'react';
React.useState();

// ❌ NEVER USE
import { useState } from 'react'; // Breaks with moduleResolution: "bundler"
```

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

### 10. Free → Pro Migration
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

## 🎯 Core Files

| File | Purpose |
|------|---------|
| `src/utils/registry.ts` | Component definitions (single source of truth) |
| `src/utils/tier.ts` | **NEW**: Tier detection from `.env` |
| `src/utils/tier-restrictions.ts` | Tier validation logic |
| `src/utils/config.ts` | Config load/save (`kigumi.config.json`) |
| `src/utils/regenerate.ts` | Auto-generate webawesome.ts, theme.css, types |
| `src/commands/init/` | Initialization logic |
| `src/commands/init/config-builder.ts` | Build config (no tier stored) |
| `src/commands/init/file-generator.ts` | Generate project files |
| `src/commands/init/installer.ts` | Install dependencies |
| `src/commands/init/migration.ts` | **NEW**: Free→Pro migration |
| `src/commands/add.ts` | Add components + auto-imports |
| `templates/react/{Component}/` | Handlebars templates |

## ⚡ Quick Commands

```bash
# Build & Test
pnpm build
cd tests/react1 && pnpm dev

# Test Free tier
node dist/index.js init --framework=react --theme=awesome

# Test Pro tier
node dist/index.js init --framework=react --theme=brutalist --token=TOKEN

# Test Migration
node dist/index.js init --token=TOKEN  # In existing Free project

# Add components
node dist/index.js add button --overwrite
```

## 🐛 Debugging

| Problem | Check | Fix |
|---------|-------|-----|
| Components unstyled | `webawesome.ts` imports? | Run `updateWebAwesomeImports()` |
| TypeScript errors | Using `React.*` pattern? | Update template |
| wa-* type errors | `vite-env.d.ts` exists? | Run `generateViteEnvDts()` |
| Theme not applying | CSS imported? HTML classes? | Check `theme.css` |
| Tier wrong | `.env` has token? | Use `detectTier()` |
| Registry mismatch | `.npmrc` correct? | Delete `node_modules` + lockfile |
| Free→Pro fails | Migration ran? | Check `migration.ts` |

## 📝 Component Template Pattern

**Simple Component:**
```typescript
import React from 'react';
import clsx from 'clsx';
import '{{{importPath}}}';

export const {{name}} = React.forwardRef<HTMLElement, {{name}}Props>(
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
3. Use `import React from 'react'` pattern
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
2. ❌ Using `{ useState }` instead of `React.useState()`
3. ❌ Using `className` on `<wa-*>` elements
4. ❌ Assuming Dialog has `hide()` (use `requestClose()`)
5. ❌ Event listeners in ref callback (use useEffect)
6. ❌ Not testing in browser
7. ❌ Writing excessive unit tests (false positives)
8. ❌ Storing tier in config (use `.env` detection)
9. ❌ Forgetting `.npmrc` for Free tier (needed to override global)

## 🧪 Testing Checklist

**Before committing:**
- [ ] `pnpm build` succeeds
- [ ] Test Free tier in browser
- [ ] Test Pro tier in browser
- [ ] Test Free→Pro migration
- [ ] No console errors in DevTools
- [ ] TypeScript works (no red squiggles)
- [ ] Components render with styles
- [ ] Event handlers fire

## 🔧 Key Implementation Details

### Tier Detection (`src/utils/tier.ts`)
```typescript
export async function detectTier(cwd: string): Promise<Tier> {
  const envPath = path.join(cwd, '.env');
  if (!(await fs.pathExists(envPath))) return 'free';
  
  const content = await fs.readFile(envPath, 'utf-8');
  const tokenMatch = content.match(/^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m);
  
  return (tokenMatch && tokenMatch[1] && tokenMatch[1].length >= 10) ? 'pro' : 'free';
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

**Last Updated**: 2026-01-09
**Maintained by**: AI Assistants
**Questions**: See `CLAUDE.md` or `README.md`
