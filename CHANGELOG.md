# kigumi

## 0.15.0

### Minor Changes

- 6ad7c40: ### Vue DX overhaul
  - **v-model support**: Vue SFC templates now use `defineModel()` for two-way binding on form controls (`Input`, `Select`, `Checkbox`, `Switch`, `Slider`, etc.) and overlay open state (`Dialog`, `Drawer`, `Dropdown`)
  - **Component-specific events**: Each template forwards its Web Awesome events (e.g. `wa-input`, `wa-change`, `wa-show`, `wa-hide`) instead of only generic `wa-blur`/`wa-focus`
  - **Named slots**: Templates expose all component slots (`header`, `footer`, `label`, `prefix`, `suffix`, etc.)
  - **Vue project scaffolding**: `kigumi init` now configures Vite plugin and tsconfig paths for Vue projects
  - **JSON parser fix**: Replaced regex-based `stripJSONComments` with a state-machine parser that no longer corrupts glob patterns like `src/**/*.ts` in tsconfig files
  - **New docs**: Vue Guide page, Customize page, framework-aware code blocks in Getting Started
  - **Style stories migrated to MDX**: All 6 Style category stories converted from `.stories.tsx` to MDX format

## 0.14.0

### Minor Changes

- ### Breaking Changes
  - **Node 18 deprecated**: Minimum supported Node.js version is now Node 20. CI no longer tests against Node 18.
  - **Setup file renamed**: Generated setup file renamed from `webawesome.ts` to `kigumi.ts`. Associated functions renamed (`regenerateWebAwesomeSetup` → `regenerateKigumiSetup`, `updateWebAwesomeImports` → `updateKigumiImports`). Update your import path from `@/lib/webawesome` to `@/lib/kigumi`.

  ### Features
  - **`--json` output**: `kigumi status` and `kigumi list` now accept a `--json` flag for CI/CD-friendly machine-readable output.
  - **`--verbose` global flag**: Enables debug logging and command timing ("Done in 1.2s" on stderr).
  - **Storybook documentation**: New Style, Layout, and Design Tokens categories with comprehensive utility class and token reference docs.
  - **Pro/Experimental badges**: Storybook sidebar now shows Pro and Experimental badges for Web Awesome component stories.
  - **Chromatic visual regression**: CI now runs Chromatic snapshot tests on pull requests.

  ### Bug Fixes
  - Fix broken double-protocol URLs (`https://https://`) in add/validator, init/index, init/installer.
  - Fix `status --json` intro banner leaking into JSON output.
  - Fix post-init next steps not showing (switched from `output.log()` to `output.info()`).
  - Fix 29 silent catch blocks across 19 files.
  - Fix post-build script referencing removed `skills/` directory.
  - Fix `loadConfig` incorrectly awaited in status and theme/show commands.

  ### Refactoring
  - Comprehensive quality audit (Phases 1–6): consolidated `KigumiConfig` type, replaced unsafe `as Error` casts, added `ConfigInvalidError`, consolidated GitHub URLs into constants, escalated ESLint `no-explicit-any` to error, added `no-console` rule.
  - Build system improvements: `tsup.config.ts` with source maps, `scripts/post-build.ts` replacing fragile shell commands.
  - Handlebars `precompile()` content validation added to template validation script.

  ### Tests
  - Added ~350 new unit tests across 20 new test files covering brand, palette, theme, init-installer, init-existing-config, framework-detection, diff, upgrade, regenerate, registry-cache, github-token, status-json, list-json, detect-framework, display-options, token-manager, and registry commands.
  - Coverage thresholds raised to 68/57/77/68 (lines/branches/functions/statements).
  - Smoke test added before npm publish in release workflow.

  ### CI/CD
  - Restructured CI into 10 parallel jobs (lint, test, integration, coverage, typecheck, validate, security, chromatic, license-check, smoke).
  - Added dependency license check (MIT/ISC/BSD/Apache allowed).
  - Added npm pack dry-run before publish.

  ### Dependencies
  - Bumped `@eslint/js`, `@types/node`, and various production/development dependencies.
  - Updated pnpm from 10.28.2 to 10.29.3.

## 0.13.0

### Minor Changes

- cbe117d: Add version pinning and migration system

  Projects now track the Kigumi CLI version that generated them via a new `kigumiVersion` field in `kigumi.config.json`. This lets you control when you upgrade and ensures you don't accidentally pull in a Web Awesome dependency update you're not ready for.

  **New commands:**
  - `kigumi upgrade` — shows a migration guide when your project version differs from the CLI version: breaking changes, WA version changes, affected components, and recommended actions. Updates `kigumiVersion` in config when confirmed.
  - `kigumi diff` — compares your installed component files against the current templates to see what's changed or locally modified before running `--overwrite`.
  - `kigumi status` now shows the pinned `kigumiVersion` (or "not pinned" for existing projects).

  **Version mismatch behavior on `kigumi add`:**
  - Minor version mismatch (e.g. project on 0.11, CLI is 0.12): warning shown, command continues
  - Major version mismatch (e.g. project on 1.x, CLI is 0.x): hard error with instructions to use `npx kigumi@{version}` or run `kigumi upgrade`

  **Provenance tracking:** Each installed component now records its `kigumiVersion` in `installedComponents`, so `kigumi diff` can show which version it was generated with.

  Existing projects without a pinned version continue to work without changes — all checks are backward-compatible.

## 0.12.0

### Minor Changes

- 9b36951: Upgrade to Web Awesome 3.3.1 with Chart, Toast, and ToastItem components
  - Bump Web Awesome from 3.2.1 to 3.3.1
  - Add Chart component (Pro) for bar, line, pie, doughnut, and other chart types
  - Add Toast component (Pro) for non-blocking notification containers
  - Add ToastItem component (Pro) for individual notification items
  - Update Badge templates with start/end slot documentation
  - Update Popup CSS template with --popup-border-width custom property
  - Add CSS styling alternative documentation for QrCode
  - Regenerate component metadata (73 components from custom-elements.json)
  - Fix metadata generation to prefer newest Web Awesome version
  - Add new components to Storybook overview grid with Data Display category

## 0.11.0

### Minor Changes

- ecece34: Community registry support: connect, install components and themes from GitHub-hosted registries.

  ### New Features
  - **`kigumi registry connect <url>`** — Connect a community registry to your project
  - **`kigumi registry list`** — List connected registries
  - **`kigumi registry remove <name>`** — Remove a connected registry
  - **`kigumi registry init`** — Scaffold a new community registry
  - **`kigumi registry validate`** — Validate registry structure
  - **`kigumi registry add-component`** — Add a component entry to registry.json
  - **`kigumi registry add-theme`** — Add a theme entry to registry.json
  - **`kigumi add --from <source>`** — Install components from a community registry (accepts URL or connected name)
  - **`kigumi theme install --from <source>`** — Install themes from a community registry (accepts URL or connected name)
  - **Name-based registry lookup** — `--from` accepts saved registry names (e.g. `--from mischa-dev`) in addition to full URLs

  ### Bug Fixes
  - Generated type declarations now include `class?: string` on all `wa-*` elements
  - Community themes correctly import from local `community-themes/` directory instead of Web Awesome package path

## 0.10.0

### Minor Changes

- fc5a60e: Add Storybook integration and extend component registry with new props
  - Registry: add missing props for ColorPicker (`inline`), Combobox (`value`), Dropdown (`size`), DropdownItem (`variant`), IntersectionObserver (`intersect-class`), Popover (`for`, `without-arrow`), Radio (`appearance`), RadioGroup (`orientation`, `disabled`, `invalid`, `help-text`), Rating (`size`), Scroller (`without-scrollbar`, `without-shadow`), Select (`invalid`, `help-text`), TabGroup (`active`), Tooltip (`for`)
  - Templates: clean up Dialog and Drawer (remove duplicate jsx/tsx files), fix Divider layout, improve Button and ColorPicker CSS
  - Types: add web-awesome type declarations for `wa-file-input`, `wa-number-input`, `wa-sparkline`

## 0.9.2

### Patch Changes

- f5ebe00: Replace wa- events with native events in react.

## 0.9.1

### Patch Changes

- 50ff06b: Enhance Dialog and Drawer components with data attributes for declarative usage, improve open/close handling, and update examples for better clarity.

## 0.9.0

### Minor Changes

- 9a12c8f: - Fix Web Awesome Pro token URL in generated .env file
  - Add setup:npmrc script for token configuration (dev only)
  - Documentation site: Kigumi Studio theme editor, new landing page with announcement banner, improved Getting Started and Troubleshooting with Pro token guidance

## 0.8.2

### Patch Changes

- Dependency updates and build improvements

  **Dependencies:**
  - Update @clack/prompts from 0.11.0 to 1.0.0
  - Update commander from 11.1.0 to 14.0.3
  - Update execa from 8.0.1 to 9.6.1
  - Update GitHub Actions (checkout v6, codecov v5)

  **Improvements:**
  - Fix build process to prevent unnecessary regeneration of metadata files
  - Enable automatic GitHub release creation in CI workflow
  - Fix @clack/prompts API compatibility

## 0.8.1

### Patch Changes

- Fix release process and clean up generated files from validation/transformation scripts

## 0.8.0

### Minor Changes

- 906c610: **BREAKING CHANGE**: Simplified event handler naming across all component templates

  **React (35 components affected):**
  - Event props renamed from `onWa*` to `on*`
  - Example: `onWaShow` → `onShow`, `onWaHide` → `onHide`
  - Handler functions renamed: `handleWaShow` → `handleShow`
  - DOM event names (`wa-show`, `wa-hide`) remain unchanged internally

  **Vue (35 components affected):**
  - Emitted events renamed from `wa-*` to simplified names
  - Example: `@wa-show` → `@show`, `@wa-hide` → `@hide`
  - DOM event listeners still use original Web Awesome event names

  **Migration:**

  ```tsx
  // Before (React)
  <Dialog onWaShow={handleOpen} onWaHide={handleClose} />

  // After (React)
  <Dialog onShow={handleOpen} onHide={handleClose} />
  ```

  ```vue
  <!-- Before (Vue) -->
  <Dialog @wa-show="handleOpen" @wa-hide="handleClose" />

  <!-- After (Vue) -->
  <Dialog @show="handleOpen" @hide="handleClose" />
  ```

  **Additional changes:**
  - Added `for` property to Tooltip component (targets elements by ID)
  - Added `scripts/validate-components.ts` for registry validation
  - Added `scripts/transform-event-names.ts` for automated event renaming

## 0.7.0

### Minor Changes

- 1381a2e: - Fixed 3 critical bugs in validation scripts
  - Added 75+ unit tests for error handling and component commands
  - Added automated validation scripts for changes, registry, and templates
  - Added CI workflows for coverage reporting and security auditing
  - Updated Web Awesome dependency to 3.2.1
  - Improved TypeScript type narrowing in add command

## 0.6.1

### Patch Changes

- Fix CI build failure by making prebuild script skip gracefully when docs dependencies are unavailable. Update README with corrected og-image URL.

## 0.6.0

### Minor Changes

- Vue.js support is now fully available. You can initialize a Kigumi project with Vue 3 (`npx kigumi init` and select Vue 3), and add Web Awesome components that generate Vue-friendly wrappers. Same components, React or Vue.

## 0.5.0

### Minor Changes

- **BREAKING CHANGE**: Rename agent skill from `transform-webawesome-to-react` to `kigumi-react`

  Renamed the agent skill to follow new naming convention `kigumi-{purpose}`. This makes it shorter, easier to type, and scalable for multi-framework support.

  **Migration:**
  - Old URL: `npx skills add https://kigumi.style/skills/transform-webawesome-to-react`
  - New URL: `npx skills add https://kigumi.style/skills/kigumi-react`

  **New skill added:**
  - `kigumi-theme`: Theme customization guidance (CSS variables, dark mode, design tokens)

  **Changes:**
  - Renamed `skills/transform-webawesome-to-react/` to `skills/kigumi-react/`
  - Added `skills/kigumi-theme/` with complete theme customization documentation
  - Updated all references in documentation (skills/README.md, llms.txt)

## 0.4.4

### Patch Changes

- Fix Vercel deployment and TypeScript build errors
  - Restore missing **CLI_VERSION** declaration in docs build
  - Convert docs to pnpm lockfile for consistency with root project
  - Pin Node.js version to 22 for Vercel compatibility
  - Add .vercelignore to optimize deployment uploads
  - Support npm users locally while enforcing pnpm in production

  This fixes ERR_INVALID_THIS errors during pnpm install on Vercel and TypeScript compilation errors for **CLI_VERSION**.

## 0.4.3

### Patch Changes

- Fix installer

## 0.4.2

### Patch Changes

- Add README.md to npm package and update homepage to kigumi.style

## 0.4.1

### Patch Changes

- Update README with improved documentation

## 0.4.0

### Minor Changes

- cfceb38: ### New Features
  - **Simplified Pro Token Setup**: Token is now detected from multiple sources with fallback chain:
    1. `$WEBAWESOME_NPM_TOKEN` environment variable (for CI/CD)
    2. Global `~/.npmrc` (recommended for local development)
    3. Project `.env` file (backwards compatible)
  - **CSS Cascade Layers**: New `layers.css` file provides predictable CSS specificity control via `@layer` rules
  - **File Preservation**: Re-running `kigumi init` now preserves your customized `theme.css` and `layers.css`
  - **Skip Install Flag**: New `--no-install` flag to skip dependency installation during init

  ### Improvements
  - Better error messages when Pro token is missing with clear setup instructions
  - Clearer setup instructions in CLI output for Pro tier
  - Streamlined README with simplified Pro setup guide

  ### Internal
  - Added CI test matrix (Node 18/20/22 × npm/pnpm/yarn)
  - Added integration tests for init command
  - New `src/utils/token.ts` module for centralized token detection

## 0.3.0

### Minor Changes

- 04aa34e: Add Web Awesome Page component template
  - Added Page component to the registry with full metadata
  - Created React templates (.tsx.hbs, .jsx.hbs) with imperative methods support
  - Added comprehensive test files for TypeScript and JavaScript
  - Included CSS template with all 17 CSS parts documented
  - Page is a Pro tier component with complex state management

## 0.2.2

### Patch Changes

- 81e7817: CLI output improvements:
  - Hide debug messages behind DEBUG environment variable
  - Simplify dependency installation output (no verbose command display)
  - Add consistent capitalization for themes, palettes, and brand colors
  - Update post-install instructions with better formatting and Web Awesome resource links

## 0.2.1

### Patch Changes

- Simplify README - remove unnecessary sections and emoji clutter
