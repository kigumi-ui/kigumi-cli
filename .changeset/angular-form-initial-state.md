---
'kigumi': patch
---

### Fixed

- **Angular**: form controls bound with reactive forms (`[formControl]`, `formControlName`) now show the control's initial value and initial disabled state. The Template looked its Web Awesome element up only after the first view check, but reactive forms write the initial state before it, so `new FormControl('a@b.c')` rendered an empty input. Every Angular Template now resolves the element at creation. Run `kigumi update` to pick up the fix in installed Angular components.
