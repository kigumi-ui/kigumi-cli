# kigumi

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
