---
'kigumi': minor
---

### Added

- **Stepper, Step**: Free wrappers for Web Awesome 3.14.0's new stepper (experimental upstream), with React/Vue/Angular templates, docs stories, and the compose-form wizard pattern. Stepper exposes `goTo()` / `next()` / `previous()` and `onBeforeStepChange` / `onStepChange`.
- **Combobox**: Server mode from Web Awesome 3.14.0: `server`, `loading` and `filter-debounce` props, `onOptionsRequest` / `onOptionsError` events, and a `reload()` method.
- **Divider**: Children render as a label on the line, placed with the new `label-placement` prop.
- **Page**: `nonce` prop for the injected media-query style tag under a Content Security Policy.
- **ZoomableFrame**: `allow`, `name` and `label` props for the embedded frame.

### Changed

- **Web Awesome**: `kigumi add`, `init` and `upgrade` now install Web Awesome 3.14.0.
