---
'kigumi': patch
---

### Fixed

- **Generated components**: installed components now pass the lint config a new Vite, Vue or Angular project ships (`@eslint/js` + typescript-eslint `recommended`). A default create-vite React project reported 8 errors after `kigumi add --all`, in Spinner, CarouselItem and ColorPicker plus their `.kigumi/snapshots/` copies. Run `kigumi update` to pick up the fix in installed components.
- **ColorPicker**: `getHexString`'s `alpha` parameter is typed `number` in the React, Vue and Angular wrappers instead of `any`.
- **Spinner, CarouselItem (React)**: `SpinnerProps` and `CarouselItemProps` are type aliases instead of empty interfaces. They accept the same props.
- **Vue**: the wrappers no longer cast to `any`. `element` is typed as the Web Awesome element, and exposed methods are type-checked against it. Components without events no longer declare an empty `defineEmits`.
- **Spinner, CarouselItem (Vue)**: the empty `SpinnerProps` / `CarouselItemProps` interfaces are removed, since neither component has props. Vue cannot compile a type alias for "no props", so unlike React there is no replacement. If you imported either type, drop the import: it declared nothing.
