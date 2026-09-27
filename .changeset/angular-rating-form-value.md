---
'kigumi': patch
---

### Fixed

- **Angular**: `Rating` now updates `[(ngModel)]` and reactive forms when the user picks a value. Its ControlValueAccessor listened for `input`, which `wa-rating` never dispatches (it only fires `change`), so the form model never changed. Form controls now read their value on `input` where the component emits one and on `change` otherwise. Run `kigumi update` to pick up the fix in an installed `Rating`.
