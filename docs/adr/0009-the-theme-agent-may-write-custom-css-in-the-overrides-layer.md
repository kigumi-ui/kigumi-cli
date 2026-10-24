# The Theme Agent may write custom CSS, in its own layer and from a checked subset

The Theme Agent spec first ruled out custom CSS in answers, so that model
output never reaches the page as raw styles. That kept the agent below what a
theme sometimes needs: rules no `--wa-*` value or shadow component can express.
The agent now proposes custom CSS too, but only when no value can express the
change, and the guarantee the old rule gave moves into code. The proposal
validator, run by the task and again by the browser, accepts only rules that
parse, allows no at-rule beyond `@media`, `@supports` and `@container`, rejects
`@import`, `url()`, `@font-face` and script-like values, caps the size, and
requires every colour to come from a `var(--wa-*)` reference, so the
accessibility check on the custom theme's values still covers what the agent
paints. Studio scopes every selector to the preview. Custom CSS the user writes
by hand is not restricted.

Custom CSS lives apart from the rest of the theme: in its own file,
`overrides.css`, imported by `layers.css` into an `overrides` layer after
`theme`, in the project and in the Studio preview alike.

## Considered Options

**Keep custom CSS out of answers** (rejected): the agent could not be the
primary way to build a theme, since part of every non-trivial theme would have
to be written by hand.

**An `@layer overrides { … }` block inside `theme.css`** (rejected): `layers.css`
imports `theme.css` into the `theme` layer, so the block becomes the sublayer
`theme.overrides`, which loses to the unlayered rules of `theme.css` itself.

## Consequences

Loosening a validator rule loosens what model output can do to the page; it is
reversing part of this decision, not a cleanup. The CLI must create
`overrides.css` wherever it writes a `layers.css` that imports it, or existing
projects stop building.
