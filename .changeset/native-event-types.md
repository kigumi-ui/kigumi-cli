---
'kigumi': patch
---

### Fixed

Native DOM events now get their real handler type in generated wrappers,
instead of `CustomEvent`.

Web Awesome's manifest gives each event a pascal-cased `eventName` (`blur`
becomes `BlurEvent`), which reads like a type but names no real DOM interface.
Each generator pattern-matched that string on its own, so they disagreed.
Handler types now come from the event's real DOM name through one shared table.

**React** — `change` is `Event`, `input` and `beforeinput` are `InputEvent`,
`load` and `error` are `Event`. `blur` and `focus` were already correct.

**Vue and Angular** — the same four corrections, plus `blur`, which was
`CustomEvent` and is now `FocusEvent`.

Web Awesome's own `wa-*` events are unchanged: they stay `CustomEvent`.

Your existing files are untouched; nothing changes until you regenerate a
component. When you do, a handler you had typed as `CustomEvent` will no longer
compile. Widening the parameter to the type listed above fixes it, and the new
type is the one the DOM actually delivers.
