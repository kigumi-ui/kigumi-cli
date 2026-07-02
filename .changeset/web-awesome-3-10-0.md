---
'kigumi': minor
---

### Added

- **New Web Awesome 3.10.0 component: RandomContent.** A Free-tier display helper that randomly selects and shows one or more of its child elements, with `items`, `mode` (`random` / `unique` / `sequence`), `autoplay`, `autoplay-interval`, and `animation` (`fade` variants) props, a `wa-content-change` event, and an imperative `randomize()` method. Ships React, Vue, and Angular wrappers plus a docs-site wrapper and Storybook story. Note: Web Awesome currently marks the component as experimental, so its upstream API may still change; the exact version pin keeps installs stable.
- **Icon gains a `canvas` prop** (`fixed` / `auto` / `square` / `roomy`) for controlling how the icon is sized within its canvas, and Font Awesome 7.3.0 support with new Pro icon families (mosaic, pixel, vellum, slab-duo, slab-press-duo) and additional animation custom properties.

### Changed

- **Web Awesome upgraded from 3.9.0 to 3.10.0.** A non-breaking minor for existing components. The dependency stays exact-pinned for both the free `@awesome.me/webawesome` and Pro `@awesome.me/webawesome-pro` packages, and `kigumi doctor` now flags `3.9.0` projects as upgradable.
- **Icon `auto-width` is deprecated** upstream in favor of `canvas="auto"`. The prop keeps working, but the wrappers now mark it `@deprecated`; migrate to `canvas="auto"`.
