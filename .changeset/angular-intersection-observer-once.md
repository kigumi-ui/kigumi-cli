---
'kigumi': patch
---

### Fixed

- **Angular**: `IntersectionObserver` compiles on current Angular again. Since 21.2.13 (and in recent 20.3 patches) Angular rejects every `on*` attribute binding as an event handler, so the Template's `[attr.once]` binding failed `ng build` with NG5002. The Template now writes `once` onto the Web Awesome element from `ngOnChanges`. Run `kigumi update` to pick up the fix if you installed it.
