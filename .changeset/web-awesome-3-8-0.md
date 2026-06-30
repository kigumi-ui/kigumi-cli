---
'kigumi': minor
---

### Added

- **Four new Web Awesome 3.8.0 components**: Accordion, AccordionItem, TimeInput, and KnownDate. All are Free tier and ship React, Vue, and Angular wrappers plus docs-site wrappers and Storybook stories.
  - **Accordion / AccordionItem** group related disclosure panels with `mode` (`single`, `single-collapsible`, `multiple`), `appearance`, `icon-placement`, and `heading-level` controls, and expose `expandAll()` / `collapseAll()`.
  - **TimeInput** is a form control for a time of day, with `with-clear`, `with-now`, `hour-format`, `step`, and a `min`/`max` range.
  - **KnownDate** is a form control for a calendar date the user already knows, with `locale` and a `min`/`max` range.
- **New text utility classes documented** on the Typography foundations page: case transforms (`wa-text-uppercase`, `wa-text-lowercase`, `wa-text-capitalize`), alignment (`wa-text-start`, `wa-text-center`, `wa-text-end`, `wa-text-justify`), wrapping (`wa-text-wrap`, `wa-text-nowrap`, `wa-text-balance`, `wa-text-pretty`), and the `wa-prose` long-form content utility.

### Changed

- **Web Awesome upgraded from 3.7.0 to 3.8.0.** A non-breaking minor for existing components (zero registry prop-value drift). The dependency stays exact-pinned for both the free `@awesome.me/webawesome` and Pro `@awesome.me/webawesome-pro` packages, and `kigumi doctor` now flags `3.7.0` projects as upgradable.
- **Transition tokens synced onto component defaults.** Following Web Awesome 3.8.0, the `--show-duration` / `--hide-duration` CSS custom properties on Combobox, Details, Dialog, Drawer, Popover, Popup, Select, ToastItem, and TreeItem now default to the shared transition tokens (`var(--wa-transition-normal)` or `var(--wa-transition-fast)`, per component) instead of hard-coded millisecond literals, so they respond to theme-level transition tokens.
- **Drawer `light-dismiss` now defaults to `false`** (Web Awesome 3.8.0). A drawer no longer closes on an outside click unless you opt in with `light-dismiss`.

### Note

- Web Awesome 3.8.0 also revises a few internal behaviors that need no Kigumi code change: the textarea disabled state now matches the input styling, and form controls submit empty strings instead of `null` for empty values.
