# Kigumi CLI - Developer Guide for Claude Code

This document provides essential context for working on the Kigumi CLI codebase.

## What is Kigumi?

Kigumi is a CLI tool that scaffolds Web Awesome components into React, Vue, or Svelte projects. It handles:
- Initial project setup with Web Awesome
- Component generation from Handlebars templates
- Tier-based restrictions (Free vs Pro)
- Theme and palette management
- Automatic dependency installation and TypeScript configuration

## Common Commands

```bash
# Development
pnpm build          # Build the CLI
pnpm build:watch    # Watch mode for development
pnpm lint           # Run ESLint
pnpm format         # Run Prettier

# Testing the CLI locally
cd test-project
pnpm dev            # Start Vite dev server (usually http://localhost:5173)

# Using the CLI (after building)
node /path/to/kigumi-cli/dist/index.js init
node /path/to/kigumi-cli/dist/index.js add button
node /path/to/kigumi-cli/dist/index.js theme set awesome
node /path/to/kigumi-cli/dist/index.js palette bright
```

## Architecture Overview

### 1. Component Registry System

**File**: [src/utils/registry.ts](src/utils/registry.ts)

Central source of truth for all Web Awesome components. Each component definition includes:
- Component name and tag name (`wa-button`)
- Category (form, layout, feedback, etc.)
- Tier (free or pro)
- Props with types and descriptions
- Template file paths for each framework

**Critical**: When adding new components, update the registry first.

### 2. Template Generation System

**Location**: [templates/](templates/)

Component templates are organized by framework and component:
```
templates/
  react/
    Button/
      Button.tsx.hbs
      Button.css.hbs
      Button.test.tsx.hbs
    Dialog/
      Dialog.tsx.hbs
      ...
    vite-env.d.ts.hbs  # TypeScript declarations for wa-* components
```

**Template Processing**:
1. User runs `kigumi add button`
2. [src/commands/add.ts](src/commands/add.ts) looks up component in registry
3. Reads appropriate `.hbs` template for user's framework
4. Compiles template with component metadata
5. Writes files to user's project
6. Updates [webawesome.ts](test-project/src/lib/webawesome.ts) with component JS import

### 3. Tier Restrictions System

**File**: [src/utils/tier-restrictions.ts](src/utils/tier-restrictions.ts)

Enforces Free vs Pro tier limitations:
- **Themes**: Free tier has 3 themes (default, awesome, shoelace), Pro has 11
- **Palettes**: ALL 9 palettes available to BOTH tiers (this was a critical bug fix)
- **Components**: 8 pro-only components (page, charts, combobox, data-grid, date-picker, file-input, toast, video)

**Validation happens at**:
- [src/commands/init.ts](src/commands/init.ts) - Theme/palette selection
- [src/commands/add.ts](src/commands/add.ts) - Component addition
- [src/commands/theme/set.ts](src/commands/theme/set.ts) - Theme changes
- [src/commands/palette.ts](src/commands/palette.ts) - Palette changes

### 4. Framework Detection

**File**: [src/utils/project-info.ts](src/utils/project-info.ts)

Detects:
- Framework (React, Vue, Svelte) from dependencies
- Package manager (npm, pnpm, yarn, bun)
- TypeScript usage
- Project structure

### 5. Configuration Management

**File**: [src/utils/config.ts](src/utils/config.ts)

Config stored in `kigumi-components.json`:
```json
{
  "framework": "react",
  "componentsDir": "src/components",
  "utilsDir": "src/lib",
  "webAwesome": {
    "tier": "free",
    "version": "1.0.0-beta.54"
  },
  "theme": {
    "name": "awesome",
    "palette": "default"
  }
}
```

## Critical Patterns & Learnings

### React Import Pattern (React 18 & 19 Compatibility)

**ALWAYS use this pattern in React templates**:

```typescript
import React from 'react';  // Default import

// Then use React.* prefixed API calls:
const [state, setState] = React.useState();
React.useEffect(() => {}, []);
React.useImperativeHandle(ref, () => ({}), []);
```

**Why**: React's types use `export = React` (CommonJS pattern) which doesn't work with named imports when using `moduleResolution: "bundler"` in TypeScript.

**Don't use**:
```typescript
import { useState, useEffect } from 'react';  // ❌ Causes TS errors
import * as React from 'react';               // ❌ Doesn't work either
```

### Web Awesome Component Registration

**Critical**: Web components must be imported to register them.

**File**: [src/lib/webawesome.ts](test-project/src/lib/webawesome.ts)

```typescript
// Import Web Awesome components (registers web components)
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
```

**Auto-Management**: [src/commands/add.ts](src/commands/add.ts) automatically adds these imports when components are added (see `updateWebAwesomeImports()` function at lines 219-268).

### TypeScript Support for Web Components

**File**: [templates/react/vite-env.d.ts.hbs](templates/react/vite-env.d.ts.hbs)

Generated during `kigumi init` for React projects. Uses module augmentation pattern:

```typescript
/// <reference types="vite/client" />

import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        class?: string;
        variant?: string;
        // ... all component props
      };
    }
  }
}
```

**Why**: Extends React's JSX.IntrinsicElements to include wa-* custom elements without breaking existing types.

**Generated by**: [src/utils/regenerate.ts](src/utils/regenerate.ts) - `generateViteEnvDts()` function (lines 85-155)

### Dialog Component API Discovery

**Critical Finding**: Web Awesome Dialog component uses `requestClose()` NOT `hide()`.

**Available methods** (from console inspection):
- `show()` - Opens the dialog ✅
- `requestClose()` - Closes the dialog ✅
- NO `hide()` method ❌

**Our Implementation**: Provide both `hide()` (alias) and `requestClose()` for better DX.

**Template**: [templates/react/Dialog/Dialog.tsx.hbs](templates/react/Dialog/Dialog.tsx.hbs)

```typescript
export interface DialogRef {
  show: () => void;
  hide: () => void;           // Alias for requestClose
  requestClose: () => void;   // Actual Web Awesome API
  element: HTMLElement | null;
}

React.useImperativeHandle(ref, () => ({
  show: () => dialogRef.current?.show(),
  hide: () => dialogRef.current?.requestClose(),      // Alias
  requestClose: () => dialogRef.current?.requestClose(),
  get element() { return dialogRef.current; }
}), []);
```

### Event Handler Naming Convention

**Pattern**: Remove `Wa` prefix from event names for cleaner API.

Web Awesome emits events like `wa-show`, `wa-after-show`, `wa-hide`, `wa-after-hide`.

**Our React wrapper props**:
```typescript
export interface DialogProps {
  onShow?: (event: CustomEvent) => void;       // NOT onWaShow
  onAfterShow?: (event: CustomEvent) => void;  // NOT onWaAfterShow
  onHide?: (event: CustomEvent) => void;
  onAfterHide?: (event: CustomEvent) => void;
}
```

**Event listener setup in useEffect**:
```typescript
React.useEffect(() => {
  const el = dialogRef.current;
  if (!el) return;

  const handleShow = (e: Event) => {
    if (onShow) onShow(e as CustomEvent);
  };

  el.addEventListener('wa-show', handleShow);  // Listen to wa-show
  return () => el.removeEventListener('wa-show', handleShow);
}, [onShow, onAfterShow, onHide, onAfterHide]);
```

### Web Component Attributes: `class` not `className`

Web components use `class` attribute, not React's `className`.

**In templates**:
```typescript
<wa-button class={clsx('Button', className)} {...props}>
  {children}
</wa-button>
```

**Props interface**:
```typescript
export interface ButtonProps extends Omit<React.HTMLAttributes<HTMLElement>, 'className'> {
  className?: string;  // Accept className from users
  // ... other props
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-button ref={ref} class={clsx('Button', className)} {...props}>
        {children}
      </wa-button>
    );
  }
);
```

### clsx Integration

**Auto-installed** during `kigumi init` for React projects.

**Code**: [src/commands/init.ts](src/commands/init.ts) lines 637-653, 690-706

Used in all component templates for className management:
```typescript
import clsx from 'clsx';

<wa-button class={clsx('Button', className)} {...props}>
```

## File Organization

### Key Directories

- [src/commands/](src/commands/) - CLI command implementations (init, add, theme, palette)
- [src/utils/](src/utils/) - Core utilities (config, registry, tier-restrictions, regenerate)
- [templates/](templates/) - Handlebars templates for React/Vue/Svelte components
- [test-project/](test-project/) - Testing ground for generated components

### Important Files

1. [src/index.ts](src/index.ts) - CLI entry point with Commander setup
2. [src/commands/init.ts](src/commands/init.ts) - Project initialization (most complex command)
3. [src/commands/add.ts](src/commands/add.ts) - Component addition with auto-import management
4. [src/utils/registry.ts](src/utils/registry.ts) - Component registry (source of truth)
5. [src/utils/tier-restrictions.ts](src/utils/tier-restrictions.ts) - Tier validation
6. [src/utils/regenerate.ts](src/utils/regenerate.ts) - File generation (vite-env.d.ts, webawesome.ts, etc.)
7. [templates/react/Dialog/Dialog.tsx.hbs](templates/react/Dialog/Dialog.tsx.hbs) - Most complex component template (events, refs, controlled/uncontrolled)

## Testing Your Changes

### 1. Build the CLI
```bash
pnpm build
```

### 2. Test in test-project
```bash
cd test-project
pnpm dev  # Opens http://localhost:5173
```

### 3. Verify in Browser
- Check that components render with correct styles
- Test Dialog functionality (show, hide, events)
- Verify no TypeScript errors in IDE
- Check browser console for errors

### 4. Test Component Addition Flow
```bash
# From kigumi-cli root
node dist/index.js add button --cwd=test-project

# Verify:
# 1. Component files created in test-project/src/components/Button/
# 2. webawesome.ts updated with import
# 3. No TypeScript errors
# 4. Component works in browser
```

## Common Gotchas

1. **Forgetting to update templates**: All component changes must be in `.hbs` files, not just generated code
2. **React import pattern**: Always use `import React from 'react'` with `React.*` API calls
3. **Dialog API**: Use `requestClose()` not `hide()` (we provide both for compatibility)
4. **Event listeners in useEffect**: Don't put them in ref callbacks, proper cleanup required
5. **Component registration**: Components won't work without JS imports in webawesome.ts
6. **Tier restrictions**: Remember ALL palettes available to BOTH tiers (common misconception)
7. **TypeScript support**: vite-env.d.ts must be generated for React projects during init

## Recent Critical Bug Fixes

### Bug: Free Tier Palette Restriction
**Issue**: Palette command only allowed 'default' for free tier
**Fix**: Updated [src/commands/palette.ts](src/commands/palette.ts) and [src/utils/tier-restrictions.ts](src/utils/tier-restrictions.ts) to allow ALL 9 palettes for both tiers
**Reason**: All palettes are available in the free tier of Web Awesome

### Bug: Missing Component Styles
**Issue**: Components rendered unstyled in browser
**Fix**: Added component JS imports to webawesome.ts - web components must be imported to register
**Auto-fix**: [src/commands/add.ts](src/commands/add.ts) now automatically adds imports

### Bug: TypeScript Errors with React Imports
**Issue**: `Module '"react"' has no exported member 'useState'` errors
**Root Cause**: `moduleResolution: "bundler"` incompatible with named imports from React types
**Fix**: Changed all templates to use `import React from 'react'` with `React.*` prefixed calls

## Web Awesome Documentation

- Main docs: https://webawesome.com/docs/
- Usage guide: https://webawesome.com/docs/usage
- React integration: https://webawesome.com/docs/#react-users
- Component docs: https://webawesome.com/components/

## Development Workflow

1. Make changes to templates or CLI code
2. Run `pnpm build` (or `pnpm build:watch`)
3. Test in test-project with `pnpm dev`
4. Verify in browser at http://localhost:5173
5. Check TypeScript errors in IDE
6. Run tests if applicable

## Questions to Ask When Making Changes

1. **Does this change need to be in templates?** (Answer is usually yes)
2. **Does this work with both React 18 and React 19?**
3. **Are tier restrictions enforced correctly?**
4. **Will TypeScript show errors to users?**
5. **Do web components need JS imports?**
6. **Are event listeners properly cleaned up?**
7. **Does the generated code match Web Awesome docs examples?**

---

**Last updated**: 2026-01-06
**Key contributors**: Session with extensive Dialog implementation, TypeScript fixes, and tier restriction improvements
