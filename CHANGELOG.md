# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.19.0] - 2026-04-04

### Added

- **Web Awesome 3.5.0**: Upgrade dependency from ^3.4.0 to ^3.5.0
- **Markdown**: New free component (experimental)
- **Page**: Moved from Pro to Free tier
- **Combobox**: New props allow-create, autocapitalize, autocorrect, enterkeyhint, inputmode, spellcheck and wa-create event
- **ColorPicker**: New placement prop
- **Textarea**: New with-count prop
- **Rating**: Now form-associated with name and required props
- **Angular**: Host attribute forwarding and AfterViewInit lifecycle for all 74 components

### Changed

- **Combobox**: Removed deprecated autocomplete prop (upstream breaking change)

### Fixed

- **Templates**: Resolved pre-existing type errors across React, Vue, and Angular via starter repo testing
- **Templates**: Angular prop sync and Markdown getMarked instance fix
- **Templates**: NumberInput Vue JS variant uses numeric fallback (val ?? 0) instead of string

## [Unreleased]

## [0.18.3] - 2026-03-29

### Fixed

- **Installer**: Auto-retry npm install on ERESOLVE peer dependency conflicts

## [0.18.2] - 2026-03-27

### Fixed

- **upgrade**: Fix Web Awesome dependency not being bumped during `kigumi upgrade`. The installer now passes the target WA version from config to the package manager (e.g. `pnpm add @awesome.me/webawesome@^3.4.0`) instead of installing without a version specifier.
- **version-map**: Fix patch releases (e.g. 0.18.1) not resolving a version entry. `getVersionEntry()` now falls back to the highest entry `<=` the requested version, so patch releases inherit the WA version from their minor release.
- **installer**: Auto-retry with `--legacy-peer-deps` when npm fails with ERESOLVE peer-dependency conflicts during install.

## [0.18.1] - 2026-03-27

### Fixed

- **Dialog/Drawer templates**: Fix TS2352 compilation error with WA 3.4.0. The `show`/`requestClose` methods are now private in WA's type definitions; use `Omit` to strip conflicting keys before re-declaring them as public for imperative use.

## [0.18.0] - 2026-03-26

### Breaking Changes

- **Input**: `autocorrect` prop type changed from `'off' | 'on'` (string union) to `boolean`
- **Slider**: `required` prop removed (WA 3.4.0 dropped the attribute)

### Added

- **Web Awesome 3.4.0**: Upgrade internal WA dependency from ^3.3.1 to ^3.4.0
- **CLI update notification**: Show a notification when a newer CLI version is available on npm (cached 24h, skipped in CI and non-TTY)

### Fixed

- **React templates**: Add explicit `WaElement | null` type to ref callback parameter for strict-mode compatibility
- **version-map**: Fix kigumiVersion entry to match actual release version (was incorrectly set to 0.13.0)
- **lint-staged**: Scope eslint to `{src,tests,scripts}/**` so docs/ uses its own config
- **Chromatic CI**: Add `--stats-json` to Storybook build for TurboSnap compatibility

## [0.17.2] - 2026-03-25

### Fixed

- **React templates**: Use WaElement type import for React 19 ref compatibility. Templates now import the actual WA element type, use `useRef<WaElement | null>`, and pass a callback ref matching the WA JSX type signature
- **Vue templates**: Use WaElement type, remove all `as any` casts from `defineExpose` methods, and remove unused `defineEmits` from no-event components
- **Vue init**: Write Vue type references to `src/env.d.ts` instead of `compilerOptions.types` array in `tsconfig.app.json`. Includes `vite/client` reference for CSS module support

### Changed

- **Init options**: Remove unused `--tier` flag from CLI. Tier is detected from package.json dependencies and `.env` token

## [0.17.1] - 2026-03-19

### Fixed

- **Docs**: Replace Shoelace-era token names with correct Web Awesome API names in theme.css comments, README examples, and generated output (e.g. `--wa-color-brand-600` to `--wa-color-brand-60`, `--wa-font-family-sans` to `--wa-font-family-body`)
- **Init**: Fix output saying "Import Web Awesome" instead of "Import Kigumi"
- **Update**: Create snapshot for `no-snapshot-match` status so future three-way merges work correctly
- **Update**: Fix conflict status formatting (misplaced closing parenthesis)

## [0.17.0] - 2026-03-17

### Fixed

- **Init**: Preserve `installedComponents` when re-running `kigumi init`, preventing config from being wiped on re-initialization
- **Upgrade**: Auto-install components listed in config during `kigumi upgrade` if they are missing from the project

## [0.16.0] - 2026-03-16

### Added

- **`kigumi update` command**: Three-way merge update workflow that intelligently merges upstream template changes with your local component modifications
- **"New" badges**: Sidebar and Welcome page cards now display "New" badges for recently added components

### Changed

- **Welcome page**: Refreshed layout, enhanced card structure, and clearer content
- **Roadmap board**: Updated visual styling for improved consistency
- **Documentation**: Added monorepo setup guide, restructured sidebar navigation, expanded troubleshooting FAQs, and added roadmap page with kanban board

## [0.15.1] - 2026-03-15

### Added

- **Community Registries**: Add Community Registries section to documentation with link from Banner component
- **Component Grid images**: Update Storybook component grid with preview images for all components

### Changed

- **Storybook layout**: Change story canvas layout from centered to padded for improved presentation
- **Story organisation**: Refine story tags and exclude VueGuide from Storybook navigation

## [0.15.0] - 2026-03-13

### Added

- **v-model support**: Vue SFC templates now use `defineModel()` for two-way binding on form controls (`Input`, `Select`, `Checkbox`, `Switch`, `Slider`, etc.) and overlay open state (`Dialog`, `Drawer`, `Dropdown`)
- **Component-specific events**: Each Vue template forwards its Web Awesome events (e.g. `wa-input`, `wa-change`, `wa-show`, `wa-hide`) instead of only generic `wa-blur`/`wa-focus`
- **Named slots**: Vue templates expose all component slots (`header`, `footer`, `label`, `prefix`, `suffix`, etc.)
- **Vue project scaffolding**: `kigumi init` now configures Vite plugin and tsconfig paths for Vue projects
- **New docs**: Vue Guide page, Customize page, framework-aware code blocks in Getting Started

### Fixed

- **JSON parser**: Replaced regex-based `stripJSONComments` with a state-machine parser that no longer corrupts glob patterns like `src/**/*.ts` in tsconfig files

### Changed

- **Style stories**: All 6 Style category stories converted from `.stories.tsx` to MDX format

## [0.14.0] - 2026-03-12

### Breaking Changes

- **Node 18 deprecated**: Minimum supported Node.js version is now Node 20. CI no longer tests against Node 18
- **Setup file renamed**: Generated setup file renamed from `webawesome.ts` to `kigumi.ts`. Associated functions renamed (`regenerateWebAwesomeSetup` to `regenerateKigumiSetup`, `updateWebAwesomeImports` to `updateKigumiImports`). Update your import path from `@/lib/webawesome` to `@/lib/kigumi`

### Added

- **`--json` output**: `kigumi status` and `kigumi list` now accept a `--json` flag for CI/CD-friendly machine-readable output
- **`--verbose` global flag**: Enables debug logging and command timing ("Done in 1.2s" on stderr)
- **Storybook documentation**: New Style, Layout, and Design Tokens categories with comprehensive utility class and token reference docs
- **Pro/Experimental badges**: Storybook sidebar now shows Pro and Experimental badges for Web Awesome component stories
- **Chromatic visual regression**: CI now runs Chromatic snapshot tests on pull requests
- **Unit tests**: ~350 new tests across 20 test files covering brand, palette, theme, init, framework-detection, diff, upgrade, registry, and more
- **CI improvements**: 10 parallel jobs, dependency license check, npm pack dry-run, smoke test before publish

### Fixed

- **URLs**: Fix broken double-protocol URLs (`https://https://`) in add/validator, init/index, init/installer
- **Status**: Fix `--json` intro banner leaking into JSON output
- **Init**: Fix post-init next steps not showing (switched from `output.log()` to `output.info()`)
- **Error handling**: Fix 29 silent catch blocks across 19 files
- **Post-build**: Fix script referencing removed `skills/` directory
- **Config**: Fix `loadConfig` incorrectly awaited in status and theme/show commands

### Changed

- **Quality audit**: Consolidated `KigumiConfig` type, replaced unsafe `as Error` casts, added `ConfigInvalidError`, consolidated GitHub URLs into constants, escalated ESLint rules
- **Build system**: `tsup.config.ts` with source maps, `scripts/post-build.ts` replacing fragile shell commands
- **Templates**: Handlebars `precompile()` content validation added to template validation script
- **Coverage thresholds**: Raised to 68/57/77/68 (lines/branches/functions/statements)
- **Dependencies**: Bumped `@eslint/js`, `@types/node`, and various production/development dependencies. Updated pnpm from 10.28.2 to 10.29.3

## [0.13.0] - 2026-03-07

### Added

- **Version pinning**: Projects now track the Kigumi CLI version via `kigumiVersion` in `kigumi.config.json`
- **`kigumi upgrade` command**: Shows migration guide when project version differs from CLI version (breaking changes, WA version changes, affected components, recommended actions)
- **`kigumi diff` command**: Compares installed component files against current templates to see what changed before running `--force`
- **Version mismatch behavior**: Minor mismatch shows warning; major mismatch shows hard error with instructions to pin or upgrade
- **Provenance tracking**: Each installed component records its `kigumiVersion` in `installedComponents`

## [0.12.0] - 2026-03-07

### Added

- **Web Awesome 3.3.1**: Upgrade from 3.2.1 to 3.3.1
- **Chart component** (Pro): Bar, line, pie, doughnut, and other chart types
- **Toast component** (Pro): Non-blocking notification containers
- **ToastItem component** (Pro): Individual notification items
- **Data Display category**: New components added to Storybook overview grid

### Changed

- **Badge templates**: Updated with start/end slot documentation
- **Popup CSS template**: Added `--popup-border-width` custom property
- **QrCode**: Added CSS styling alternative documentation
- **Component metadata**: Regenerated (73 components from custom-elements.json)

### Fixed

- **Metadata generation**: Prefer newest Web Awesome version

## [0.11.0] - 2026-03-05

### Added

- **`kigumi registry connect <url>`**: Connect a community registry to your project
- **`kigumi registry list`**: List connected registries
- **`kigumi registry remove <name>`**: Remove a connected registry
- **`kigumi registry init`**: Scaffold a new community registry
- **`kigumi registry validate`**: Validate registry structure
- **`kigumi registry add-component`**: Add a component entry to registry.json
- **`kigumi registry add-theme`**: Add a theme entry to registry.json
- **`kigumi add --from <source>`**: Install components from a community registry (accepts URL or connected name)
- **`kigumi theme install --from <source>`**: Install themes from a community registry
- **Name-based registry lookup**: `--from` accepts saved registry names (e.g. `--from mischa-dev`) in addition to full URLs

### Fixed

- **Type declarations**: Now include `class?: string` on all `wa-*` elements
- **Community themes**: Correctly import from local `community-themes/` directory instead of Web Awesome package path

## [0.10.0] - 2026-02-28

### Added

- **Storybook integration**: Component stories and documentation
- **Type declarations**: Added for `wa-file-input`, `wa-number-input`, `wa-sparkline`
- **Registry props**: Added missing props for ColorPicker, Combobox, Dropdown, DropdownItem, IntersectionObserver, Popover, Radio, RadioGroup, Rating, Scroller, Select, TabGroup, Tooltip

### Changed

- **Templates**: Clean up Dialog and Drawer (remove duplicate jsx/tsx files), fix Divider layout, improve Button and ColorPicker CSS

## [0.9.2] - 2026-02-19

### Changed

- **React events**: Replace `wa-` events with native events

## [0.9.1] - 2026-02-18

### Changed

- **Dialog/Drawer**: Add data attributes for declarative usage, improve open/close handling, and update examples

## [0.9.0] - 2026-02-15

### Added

- **Kigumi Studio**: Theme editor on documentation site
- **Landing page**: New design with announcement banner
- **setup:npmrc script**: Token configuration for development

### Fixed

- **Pro token**: Fix Web Awesome Pro token URL in generated .env file

### Changed

- **Documentation**: Improved Getting Started and Troubleshooting with Pro token guidance

## [0.8.2] - 2026-02-10

### Added

- **CI**: Automatic GitHub release creation in workflow

### Fixed

- **Build**: Prevent unnecessary regeneration of metadata files
- **@clack/prompts**: Fix API compatibility after update

### Changed

- **Dependencies**: Update @clack/prompts to 1.0.0, commander to 14.0.3, execa to 9.6.1, GitHub Actions (checkout v6, codecov v5)

## [0.8.1] - 2026-02-10

### Fixed

- **Release process**: Fix release and clean up generated files from validation/transformation scripts

## [0.8.0] - 2026-02-10

### Breaking Changes

- **React events**: Event props renamed from `onWa*` to `on*` across 35 components (e.g. `onWaShow` to `onShow`, `onWaHide` to `onHide`)
- **Vue events**: Emitted events renamed from `wa-*` to simplified names across 35 components (e.g. `@wa-show` to `@show`)

### Added

- **Tooltip**: `for` property to target elements by ID
- **Validation**: `scripts/validate-components.ts` for registry validation
- **Migration**: `scripts/transform-event-names.ts` for automated event renaming

## [0.7.0] - 2026-02-09

### Added

- **Unit tests**: 75+ new tests for error handling and component commands
- **Validation scripts**: Automated checks for changes, registry, and templates
- **CI workflows**: Coverage reporting and security auditing

### Fixed

- **Validation scripts**: 3 critical bugs fixed

### Changed

- **Web Awesome**: Dependency updated to 3.2.1
- **Add command**: Improved TypeScript type narrowing

## [0.6.1] - 2026-02-09

### Fixed

- **CI build**: Prebuild script skips gracefully when docs dependencies are unavailable
- **README**: Corrected og-image URL

## [0.6.0] - 2026-02-09

### Added

- **Vue.js support**: Initialize a Kigumi project with Vue 3 (`npx kigumi init` and select Vue 3) and generate Vue-friendly component wrappers

## [0.5.0] - 2026-02-08

### Breaking Changes

- **Agent skill renamed**: `transform-webawesome-to-react` renamed to `kigumi-react` following `kigumi-{purpose}` convention

### Added

- **`kigumi-theme` skill**: Theme customization guidance (CSS variables, dark mode, design tokens)

## [0.4.4] - 2026-02-07

### Fixed

- **Vercel deployment**: Restore missing `__CLI_VERSION__` declaration in docs build
- **Vercel**: Fix `ERR_INVALID_THIS` errors during pnpm install
- **TypeScript**: Fix compilation errors for `__CLI_VERSION__`

### Changed

- **Docs**: Convert to pnpm lockfile for consistency with root project
- **Vercel**: Pin Node.js to 22, add `.vercelignore` for optimized uploads

## [0.4.3] - 2026-02-07

### Fixed

- **Installer**: Fix broken installer

## [0.4.2] - 2026-02-07

### Changed

- **npm package**: Add README.md and update homepage to kigumi.style

## [0.4.1] - 2026-02-07

### Changed

- **README**: Improved documentation

## [0.4.0] - 2026-02-07

### Added

- **Pro token detection**: Fallback chain from `$WEBAWESOME_NPM_TOKEN` env var to `~/.npmrc` to `.env` file
- **CSS Cascade Layers**: New `layers.css` provides predictable CSS specificity control via `@layer` rules
- **`--no-install` flag**: Skip dependency installation during init
- **File preservation**: Re-running `kigumi init` preserves customized `theme.css` and `layers.css`
- **CI test matrix**: Node 18/20/22 x npm/pnpm/yarn
- **Integration tests**: Added for init command

### Changed

- **Error messages**: Better guidance when Pro token is missing
- **CLI output**: Clearer setup instructions for Pro tier
- **README**: Streamlined with simplified Pro setup guide

## [0.3.0] - 2026-01-29

### Added

- **Page component** (Pro): React templates with imperative methods support, CSS template with all 17 CSS parts documented

## [0.2.2] - 2026-01-29

### Changed

- **CLI output**: Hide debug messages behind `DEBUG` env variable, simplify dependency installation output, consistent capitalization for themes/palettes/brand colors, improved post-install instructions

## [0.2.1] - 2026-01-29

### Changed

- **README**: Simplified, removed unnecessary sections
