---
'kigumi': patch
---

### Fixed

- **Agent skill references**: The generated `*-api-surface.md` files documented Web Awesome CSS part and attribute names incorrectly. They were run through Prettier, which reads `_` as emphasis syntax and rewrote the identifiers it found: `eyedropper-button__base` was stored as `eyedropper-button**base`, and `target="_blank"` as `target="\_blank"`. Agents copy these names verbatim into user code, so the reference was actively misleading. The files are now compared and committed as the generator emits them, and are excluded from Prettier so nothing re-mangles them.
- **validate:generated-fresh**: Check A could not pass on a checkout with a Web Awesome Pro CEM, because it compared Prettier-rewritten markdown against raw generator output. It now passes, and catches a re-introduced mangling.
