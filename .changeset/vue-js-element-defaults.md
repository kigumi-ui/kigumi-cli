---
'kigumi': patch
---

### Fixed

- **Vue (JavaScript)**: Components no longer write Kigumi's documented defaults onto the Web Awesome element when a prop is unset, so they render like the React, Vue TypeScript and Angular components. In JavaScript Vue projects this means Button uses Web Awesome's `accent` appearance instead of `filled`, Slider hides its tooltip until you set `with-tooltip`, SplitPanel no longer pins its start panel, Sparkline draws `solid` / `linear` by default, an unnamed RadioGroup is no longer submitted as `option`, and the console no longer warns that `size="medium"` is deprecated. Run `kigumi update` to pick it up in installed components.
- **Docs and skills**: The documented defaults now match Web Awesome's: `size` defaults to `m`, Button `appearance` to `accent`, Slider `with-tooltip` to off, Sparkline `appearance` / `curve` to `solid` / `linear`, and SplitPanel `primary`, Callout `appearance` and RadioGroup `name` have none.
