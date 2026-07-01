---
'kigumi': minor
---

### Added

- **New Web Awesome 3.9.0 component: CheckboxGroup.** A Free-tier form control that labels and groups a set of checkboxes so they share hint text and validation, with `label`, `hint`, `orientation` (`horizontal` / `vertical`), `size`, `required`, and the SSR-only `with-label` / `with-hint` flags. Ships React, Vue, and Angular wrappers plus a docs-site wrapper and Storybook story.
- **Tree gains a `leaf-multiple` selection mode.** `<Tree selection="leaf-multiple">` lets multiple leaf nodes be selected while parent nodes only expand and collapse.

### Changed

- **Web Awesome upgraded from 3.8.0 to 3.9.0.** A non-breaking minor for existing components. The dependency stays exact-pinned for both the free `@awesome.me/webawesome` and Pro `@awesome.me/webawesome-pro` packages, and `kigumi doctor` now flags `3.8.0` projects as upgradable.
- **Transition tokens synced onto component defaults.** Following Web Awesome 3.9.0, the `--show-duration` / `--hide-duration` / `--easing` CSS custom properties on AccordionItem and TimeInput now default to the shared transition tokens (`var(--wa-transition-normal)`, `var(--wa-transition-fast)`, `var(--wa-transition-easing)`) instead of hard-coded literals, so they respond to theme-level transition tokens.

### Removed

- **`--wa-accordion-divider-color` removed from AccordionItem** (Web Awesome 3.9.0 dropped it due to improper scope). The AccordionItem docs no longer list it; theme accordion dividers via surrounding surface tokens instead.
