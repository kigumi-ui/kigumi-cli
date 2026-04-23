---
'kigumi': patch
---

### Changed

- **Tightened registry validation (`scripts/validate-registry.ts`).** Two author-time checks that previously let invalid data slip through are now strict:
  - `validateTagName` now requires exact equality between the registry key (normalised to kebab-case) and the tag name without its `wa-` prefix. Previously a substring check allowed a key like `input` to silently pass against `wa-number-input`. (F-021)
  - A new `validateProps` pass inspects each entry in `component.props`: the `name` must be non-empty, the `type` must be one of `string | boolean | number`, `values` (when declared) must be an array, and a declared `default` must be one of the declared `values`. Previously only `Array.isArray(component.props)` was checked, so malformed prop definitions could reach the template layer. (F-022)

  Current registry data already conforms, so `pnpm validate:registry` continues to pass. The validator functions are now exported and `main()` is guarded so they can be unit-tested in isolation (mirrors `validate-cem-sync.ts` / `validate-parity.ts`).
