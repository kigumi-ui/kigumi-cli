---
'kigumi': minor
---

### New Features

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
