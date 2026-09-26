---
'kigumi': patch
---

### Fixed

- **Vue**: multi-word boolean props such as `with-caret`, `with-clear` or `light-dismiss` now reach the Web Awesome element. Vue camelized them, so the first render wrote an attribute (`withcaret`) that Web Awesome never reads. Run `kigumi update` to pick up the fix in installed Vue components.
- **Vue**: a `false` value no longer turns a Web Awesome boolean on. Attributes passed through without a declared prop (for example `:with-hint="false"`), and the `v-model:open` / checked models, rendered as `attr="false"`, which Web Awesome treats as present.
- **Vue**: event listeners on the Web Awesome element are now removed on unmount. The cleanup ran after Vue had cleared the element ref, so it never removed anything.
