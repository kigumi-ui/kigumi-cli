# kigumi

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
