---
'kigumi': patch
---

### Fixed

- **Vue wrappers no longer forward `false` boolean props to the underlying `<wa-*>` element.** Vue's runtime boolean-prop coercion materialized absent optional `Boolean` props as `false`, which the previous `definedProps` filter (which dropped only `undefined`) let through. Because Web Awesome elements read attribute presence as truthy, `<Button variant="brand">` rendered as `<wa-button … pill="" disabled="false" loading="" with-caret="false">`, pill-shaped and with a stuck loading spinner. The filter now drops `undefined` and `false` before `v-bind`. Affects every Vue component with optional boolean props (Button, Input, Switch, Checkbox, Drawer, Dialog, etc.). No change to React or Angular templates. Existing Vue projects must run `kigumi update --force` after upgrading to regenerate their component wrappers with the corrected filter. (F-068)
