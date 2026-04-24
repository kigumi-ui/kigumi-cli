---
'kigumi': patch
---

### Fixed

- **Next.js Pages Router + Webpack: WA theme CSS variables now apply at `:root` (F-038).** Pages Router's CSS pipeline (`next-css-loader` + `postcss-import`) drops the whole `@import … layer(…)` line when it inlines the chain, so the theme stylesheet (`default.css`) never entered the bundle. `--wa-color-brand-*`, `--wa-font-family-*`, and palette role tokens ended up empty at `:root`; components rendered with fallback appearance even though they upgraded correctly. `layers.css` now emits plain `@import` statements on Pages Router, which Webpack accepts. The `@layer base, theme;` declaration still emits so any named-layer authoring the user adds keeps `base < theme` order; the WA imports themselves land as unlayered styles, which outrank named layers via cascade semantics. App Router (Turbopack) and Vite are unchanged, they preserve the qualifier. The 0.20 "Known limitation" callout and manual `_app.tsx` workaround in the Upgrading guide are removed.
