---
'kigumi': patch
---

### Changed

- **CSS component templates now carry the `.css` extension instead of `.css.hbs`.** All 222 CSS templates across `templates/{react,vue,angular}/` were static CSS with zero Handlebars expressions. The `.hbs` suffix misled contributors into thinking `{{name}}` etc. would work there, and forced the CLI to run every CSS file through the Handlebars compiler on every `kigumi add` invocation. Templates are now read verbatim via `fs.readFile`. The validator, template generators, and contributor docs have been updated to match. Authors adding new components should create `{Component}.css` (or `{kebab-name}.component.css` for Angular) alongside the `.hbs` files for the other artifacts. (F-031)

### Removed

- **Dead `quoteProp` Handlebars helper and unused `TemplateContext.kebabName` / `TemplateContext.props` fields** in `src/utils/template.ts`. None of the 222 `.hbs` templates ever referenced these; `buildTemplateContext` populated `props` for every render with no consumer. (F-026)
- **`src/utils/css-metadata.ts`** (moved to `scripts/css-metadata.ts`). Its `CSS_METADATA` table was consumed only by the three build-time generator scripts (`generate-{angular,react,vue}-templates.ts`), while the runtime exports (`generateCSSTemplate`, `getCSSMetadata`) were reached only as a fallback for components without a `.css.hbs` template, a path unreachable in practice because every supported component has one. The data moves next to its build-time consumers; the fallback is replaced with a `throw` so a missing CSS template after adding a new component fails loudly instead of silently emitting a placeholder. (F-027)
