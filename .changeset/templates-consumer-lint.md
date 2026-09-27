---
'kigumi': patch
---

### Fixed

- **Generated components**: installed components, and their `.kigumi/snapshots/` copies, now pass `@eslint/js` + typescript-eslint `recommended` with default options, the rule set a new create-vite React project lints with. A default create-vite React project reported 8 errors after `kigumi add --all`, in Spinner, CarouselItem and ColorPicker plus their snapshot copies. Rules from framework plugins on top (`eslint-plugin-react-hooks`, `eslint-plugin-vue`, angular-eslint) are not covered. Run `kigumi update` to pick up the fix in installed components.
- **ColorPicker**: `getHexString`'s `alpha` parameter is typed `number` in the React, Vue and Angular wrappers instead of `any`.
- **Spinner, CarouselItem**: `SpinnerProps` and `CarouselItemProps` are type aliases instead of empty interfaces, in React (`Omit<HTMLAttributes<HTMLElement>, 'dir'>`) and Vue (`object`). Both accept the same props objects as before, and still work with `interface MyProps extends SpinnerProps`.
- **Vue**: the wrappers no longer cast to `any`. `element` is typed as the Web Awesome element, so your type-checker checks calls to the exposed methods against it. Components without events no longer declare an empty `defineEmits`.
