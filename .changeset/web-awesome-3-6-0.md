---
'kigumi': minor
---

### Changed

- **Web Awesome upgraded from 3.5.0 to 3.6.0.** A non-breaking minor: no components were added or removed. The dependency is exact-pinned (free `@awesome.me/webawesome` and Pro `@awesome.me/webawesome-pro`), and `kigumi doctor` now flags `3.5.0` projects as upgradable.

### Added

- **XS/XL and short-form sizes for form controls.** The 18 form controls that expose a `size` prop (Button, Callout, Checkbox, ColorPicker, Combobox, Dropdown, FileInput, Input, NumberInput, Radio, RadioGroup, Rating, Select, Slider, Switch, Tag, Textarea, ToastItem) now accept `xs`, `s`, `m`, `l`, and `xl` in addition to `small`, `medium`, and `large`, mirroring Web Awesome 3.6.0. `medium` remains the default.
- **`onBeforeinput` event on NumberInput.** Forwards Web Awesome 3.6.0's new `beforeinput` event; it can be cancelled with `event.preventDefault()` to block the value change.
- **Enum prop-value drift detection in `validate:cem-sync`.** The gate now diffs each registry enum `prop.values` against the live `custom-elements.json` attribute type (which the generated metadata does not carry). Registry values Web Awesome no longer accepts fail the build; newly-added Web Awesome values not yet surfaced are reported as warnings — closing the gap that let the 3.6.0 size widening pass silently.
