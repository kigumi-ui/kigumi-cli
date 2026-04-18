---
'kigumi': patch
---

Fix React fallback test template to query the `<wa-*>` element by tag name and assert on `.className`, matching the canonical pattern from dedicated `.test.tsx.hbs` templates. Previously the fallback emitted `container.querySelector('.custom-class')` with `.toBeInTheDocument()`, which would pass incidentally even if the class landed on a wrapper element. Affects only new components installed without a dedicated test template; all 74 shipped components have dedicated templates and are unaffected.
