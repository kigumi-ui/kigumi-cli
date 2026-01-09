# Kigumi CLI - AI Agent Guide

> **shadcn/ui for Web Awesome** - Template-based CLI for React/Vue/Svelte wrappers around Web Awesome components.

**Status**: MVP Complete ✅ | **Framework**: TypeScript, Commander, Handlebars

## 🚨 Critical Rules (Must Follow)

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

### 8. Tier Restrictions
- **Free**: 3 themes, ALL 9 palettes, most components
- **Pro**: 11 themes, ALL 9 palettes, ALL components
- **Pro-only**: page, charts, combobox, data-grid, date-picker, file-input, toast, video

### 9. Registry URL (Critical for pnpm)
```
✅ @awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro
❌ NO trailing slash (causes ERR_PNPM_REGISTRIES_MISMATCH)
```

### 10. Pro Token Workflow
```bash
# Interactive
kigumi init         # Prompts for token
kigumi install      # Installs @awesome.me/webawesome-pro

# Non-interactive
kigumi init --tier=pro --token=YOUR_TOKEN
```
Token saved to `.env`, referenced in `.npmrc`.

### 11. Manual Setup Required
CLI does NOT configure:
1. Path aliases (`vite.config.ts` + `tsconfig.json`)
2. Web Awesome import in `main.tsx`

Users must manually add `import '@/lib/webawesome'` to main entry.

## 🎯 Core Files

| File | Purpose |
|------|---------|
| `src/utils/registry.ts` | Single source of truth for components |
| `src/utils/tier-restrictions.ts` | Tier validation logic |
| `src/commands/add.ts` | Component addition + auto-imports |
| `src/utils/regenerate.ts` | Auto-generate webawesome.ts, vite-env.d.ts, theme.css |
| `templates/react/Button/` | Simple component template reference |
| `templates/react/Dialog/` | Complex component template (events, refs) |

## 🐛 Debugging

| Problem | Fix |
|---------|-----|
| Components unstyled | Check webawesome.ts imports |
| TypeScript errors | Use `React.*` pattern, not named imports |
| wa-* type errors | Run `init` or regenerate vite-env.d.ts |
| Dialog won't close | Use `requestClose()` |
| Memory leaks | Event listeners in useEffect with cleanup |
| Registry mismatch (pnpm) | Remove trailing slash from .npmrc |
| "Failed to resolve @/lib" | Configure path aliases manually |
| "401 Unauthorized" | Check token in .env, run `kigumi install` |
| Components not rendering | Import '@/lib/webawesome' in main.tsx |

## 🧪 Testing (Critical)

**DO NOT rely on unit tests only. They give false confidence.**

### Required Tests Before Commit:

1. **Visual Browser Test** (Primary validation)
   ```bash
   pnpm build
   cd tests/react8 && pnpm dev
   # Open http://localhost:5173
   # Verify: Styles work, events fire, no console errors
   ```

2. **Terminal Happy Paths**
   ```bash
   # Test full workflow
   pnpm create vite@latest tests/react9 --template react
   cd tests/react9 && pnpm install
   node ../../dist/index.js init --framework=react --tier=free
   node ../../dist/index.js add button card dialog
   pnpm dev
   ```

3. **TypeScript Validation**
   ```bash
   pnpm type-check
   # Check IDE: No red squiggles in generated files
   ```

4. **Test Matrix** (Use multiple test projects)
   - `tests/react1`: Free tier, TypeScript
   - `tests/react2`: Pro tier, TypeScript
   - `tests/react7`: Free tier, JavaScript
   - `tests/react8`: Pro tier, JavaScript

### Why Visual Tests Matter
- Unit tests can't catch: Web component registration, CSS loading, browser APIs
- Console errors only show in browser DevTools
- Event listeners might "pass" tests but leak memory
- TypeScript might compile but break in IDE

## 📝 Component Addition Workflow

```
1. Update registry.ts (name, tier, importPath, props)
2. Create templates in templates/react/{Component}/
3. Follow React import pattern
4. Add TypeScript declarations in vite-env.d.ts.hbs
5. Build: pnpm build
6. Test: node dist/index.js add {component} --cwd=tests/react1
7. Browser test: cd tests/react1 && pnpm dev
8. Verify: Files generated, imports added, renders correctly
```

## 📋 Quick Reference

### Build & Test
```bash
pnpm build                    # One-time
pnpm build:watch              # Watch mode

# Test workflow
node dist/index.js init --cwd=tests/react9
node dist/index.js add button --cwd=tests/react9
cd tests/react9 && pnpm dev
```

### Component Templates
**Simple (Button)**: Basic component with props
**Complex (Dialog)**: Events, refs, imperativeHandle, controlled/uncontrolled

### Auto-Generated Files (Don't Edit)
- `src/lib/webawesome.ts` - Component imports
- `vite-env.d.ts` - TypeScript declarations
- `theme.css` - Theme CSS

### Common Mistakes
1. Editing generated code instead of `.hbs` templates
2. Using `{ useState }` instead of `React.useState()`
3. Forgetting web component imports
4. Using `className` on `<wa-*>` elements
5. Not testing in browser
6. Trusting unit tests without visual verification
7. Skipping path alias configuration
8. Not importing Web Awesome in main entry

## 🔧 5 Core Systems

1. **Registry** - Component definitions (single source of truth)
2. **Templates** - Handlebars templates per framework
3. **Tier** - Free/Pro validation at init, add, theme commands
4. **Config** - kigumi-components.json load/save
5. **Generation** - Auto-generate supporting files

## 💡 Key Insights

- **Registry Structure**: Changes here propagate to entire system
- **Template Patterns**: Reference Button (simple) and Dialog (complex)
- **Browser First**: Always test in browser before committing
- **Multiple Test Projects**: Different tiers/configs catch edge cases
- **clsx auto-installs**: During init, don't add manually
- **Path aliases manual**: CLI doesn't modify vite.config.ts
- **Web Awesome import manual**: User must add to main.tsx

---

**Last Updated**: 2026-01-09
**For Users**: See `README.md` | **For Humans**: See `CLAUDE.md`
