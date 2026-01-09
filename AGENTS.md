# Kigumi CLI - AI Agent Guide

> **shadcn/ui for Web Awesome** - Template-based CLI that scaffolds React/Vue/Svelte wrappers for Web Awesome components with tier restrictions and theme management.

**Status**: MVP Complete ✅ | **Framework**: TypeScript, Commander, Handlebars

## 🚨 Critical Rules (Top Priority)

### 1. React Import Pattern (React 18/19 Compatibility)

```typescript
// ✅ ALWAYS USE THIS
import React from 'react';
React.useState();
React.useEffect();

// ❌ NEVER USE THESE
import { useState } from 'react'; // TypeScript errors
import * as React from 'react'; // Doesn't work
```

**Why**: `moduleResolution: "bundler"` breaks named imports from React types.

### 2. Templates-First Development

**Never edit generated code only. Always update `.hbs` templates first.**

Workflow: Edit `.hbs` → `pnpm build` → Re-add with `--overwrite` → Test

### 3. Web Component Registration

Web components MUST be imported in `src/lib/webawesome.ts`:

```typescript
import '@awesome.me/webawesome/dist/components/button/button.js';
```

Auto-managed by `updateWebAwesomeImports()` in `src/commands/add.ts`.

### 4. `class` NOT `className`

Web components use `class` attribute. Convert user's `className` prop to `class`.

### 5. Dialog API Uses `requestClose()` Not `hide()`

Provide both in wrapper: `hide()` aliases to `requestClose()`.

### 6. Tier Restrictions

- **Free**: 3 themes (default/awesome/shoelace), ALL 9 palettes, most components
- **Pro**: 11 themes, ALL 9 palettes, ALL components (8 are Pro-only)
- Validate in: `init`, `add`, `theme set`, `palette` commands

### 7. Remove `wa-` Prefix from Event Props

`wa-show` → `onShow`, `wa-after-show` → `onAfterShow` (cleaner API)

## ⚡ Quick Start

```bash
# Build & Test
pnpm build
cd tests/react1 && pnpm dev  # http://localhost:5173

# CLI Usage (from root)
node dist/index.js init
node dist/index.js add button --overwrite --cwd=tests/react1
node dist/index.js theme set awesome --cwd=tests/react1
```

## 📁 Key Files

| What               | Where                            |
| ------------------ | -------------------------------- |
| Component registry | `src/utils/registry.ts`          |
| CLI commands       | `src/commands/*.ts`              |
| Templates          | `templates/react/{Component}/`   |
| Tier restrictions  | `src/utils/tier-restrictions.ts` |
| Config management  | `src/utils/config.ts`            |
| File generation    | `src/utils/regenerate.ts`        |

## 🏗️ Architecture

### Component Addition Flow

```
User: kigumi add button
  ↓
1. Load config (config.ts)
2. Check tier (tier-restrictions.ts)
3. Get component def (registry.ts)
4. Read templates (templates/react/Button/*.hbs)
5. Compile with Handlebars
6. Write files (components/Button/)
7. Update webawesome.ts imports
8. Update vite-env.d.ts types
```

### 5 Key Systems

1. **Registry** (`registry.ts`) - Component definitions (props, tier, files)
2. **Templates** (`templates/`) - Handlebars templates per framework
3. **Tier** (`tier-restrictions.ts`) - Free/Pro validation
4. **Config** (`config.ts`) - `kigumi-components.json` management
5. **Generation** (`regenerate.ts`) - Auto-generate webawesome.ts, vite-env.d.ts, theme.css

## 📋 Common Workflows

### Add New Component

1. Update `LOCAL_REGISTRY` in `src/utils/registry.ts` with component metadata
2. Create templates in `templates/react/{Component}/` (`.tsx.hbs`, `.css.hbs`, `.test.tsx.hbs`)
3. Build & test: `pnpm build` → `node dist/index.js add {component} --cwd=tests/react1`

### Fix Component Bug

1. Identify: Template issue vs CLI logic vs tier restriction
2. Edit template → rebuild → regenerate with `--overwrite`
3. Test in browser + verify TypeScript

### Add Theme

1. Update `FREE_THEMES` or `PRO_THEMES` in `tier-restrictions.ts`
2. Verify appears in prompt (dynamically generated)
3. Test: `node dist/index.js theme set {theme}`

## 🐛 Debugging Quick Reference

| Problem                | Check                               | Fix                                            |
| ---------------------- | ----------------------------------- | ---------------------------------------------- |
| Components unstyled    | Component imports in webawesome.ts? | Run `updateWebAwesomeImports()`                |
| TypeScript errors      | Using `React.*` pattern?            | Update template to `import React from 'react'` |
| wa-\* type errors      | vite-env.d.ts exists?               | Run `init` or `generateViteEnvDts()`           |
| Theme not applying     | CSS imported? HTML classes set?     | Run `theme set {theme}`                        |
| Tier restriction wrong | Check tier-restrictions.ts          | Remember: ALL palettes for BOTH tiers          |

## 📝 Component Template Pattern

```typescript
import React from 'react';
import clsx from 'clsx';
import './{{name}}.css';

export interface {{name}}Props extends Omit<React.HTMLAttributes<HTMLElement>, 'className'> {
  className?: string;
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
}

export const {{name}} = React.forwardRef<HTMLElement, {{name}}Props>(
  ({ children, className, ...props }, ref) => (
    <wa-{{tag-name}} ref={ref} class={clsx('{{name}}', className)} {...props}>
      {children}
    </wa-{{tag-name}}>
  )
);

{{name}}.displayName = '{{name}}';
```

**Complex components** (events/methods): See `templates/react/Dialog/Dialog.tsx.hbs`

## 🧪 Testing Checklist

**Before committing:**

- [ ] `pnpm build` succeeds
- [ ] `pnpm type-check` passes
- [ ] Test in browser (`cd tests/react1 && pnpm dev`)
- [ ] No console errors
- [ ] TypeScript works in IDE

**Test projects**: `tests/react1-6/` - Use different projects for different configs/tiers.

## ⚠️ Common Mistakes

1. Editing generated code instead of templates
2. Using `{ useState }` instead of `React.useState()`
3. Forgetting web component imports in webawesome.ts
4. Using `className` on web components instead of `class`
5. Assuming Dialog has `hide()` (use `requestClose()`)
6. Restricting palettes to Pro (ALL available to both)
7. Event listeners in ref callback (use useEffect with cleanup)

## 🚀 Quick Commands

```bash
# Development
pnpm build:watch

# Add components
node dist/index.js add button --cwd=tests/react1
node dist/index.js add button --overwrite --cwd=tests/react1
node dist/index.js add --all --cwd=tests/react1

# Theme management
node dist/index.js theme set awesome --cwd=tests/react1
node dist/index.js palette bright --cwd=tests/react1
node dist/index.js theme show --cwd=tests/react1
node dist/index.js theme list
```

## 💡 Pro Tips

- Use multiple test projects for edge cases
- Check browser console for runtime errors
- Verify in DevTools for actual web component API
- Read Web Awesome docs in `webawesome-docs/` folder
- clsx auto-installed, don't add manually
- TypeScript declarations auto-generate

## 📚 Documentation

| File                | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `AGENTS.md`         | This file - AI assistant guide            |
| `CLAUDE.md`         | Detailed developer guide (human-readable) |
| `PROJECT-STATUS.md` | Current implementation status             |
| `THEME-SYSTEM.md`   | Web Awesome theme system                  |
| `INSTALLATION.md`   | Package installation & tier setup         |

## 🎯 Getting Started

1. Read this file (✅)
2. Read `PROJECT-STATUS.md` for current state
3. Build: `pnpm build`
4. Test: `cd tests/react1 && pnpm dev`
5. Check working components: Button, Input, Card, Dialog
6. Read `CLAUDE.md` for deep dive

**Most important files:**

- `src/utils/registry.ts` - Component definitions
- `src/commands/add.ts` - Component addition logic
- `templates/react/Button/Button.tsx.hbs` - Simple template
- `templates/react/Dialog/Dialog.tsx.hbs` - Complex template

---

## Changelog

- **2026-01-09**: Optimized for universal AI tool compatibility, reduced to <300 lines
- **2026-01-09**: Initial AGENTS.md created from CLAUDE.md

**Maintained by**: AI Assistants | **Questions**: See `CLAUDE.md` or `webawesome-docs/`
