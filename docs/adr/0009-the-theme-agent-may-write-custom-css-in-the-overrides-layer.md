# The Theme Agent may write custom CSS, in its own layer and from a checked subset

The Theme Agent spec first ruled out custom CSS in answers, so that model
output never reaches the page as raw styles. That kept the agent below what a
theme sometimes needs: rules no `--wa-*` value or shadow component can express.
The agent now proposes custom CSS too, but only when no value can express the
change, and the guarantee the old rule gave moves into code. The proposal
validator, run by the task and again by the browser, accepts only rules that
parse, allows no at-rule beyond `@media`, `@supports`, `@container` and
`@keyframes` (see the amendment below), rejects
`@import`, `url()`, `@font-face` and script-like values, caps the size, and
requires every colour to come from a `var(--wa-*)` reference, so the
accessibility check on the custom theme's values still covers what the agent
paints. Studio scopes every selector to the preview. Custom CSS the user writes
by hand is not restricted.

Custom CSS lives apart from the rest of the theme: in its own file,
`overrides.css`, imported by `layers.css` into an `overrides` layer after
`theme`. The Studio preview gives it the same precedence without a layer:
the custom theme's values sit inline on the preview's theme root, which beats
any layered rule, so Studio keeps custom CSS unlayered, last, and scoped to
the preview (#193).

## Amendment: `@keyframes`

An answer may define an animation no value expresses, such as a shimmer on
skeletons, a pulse or a hover effect, so the validator accepts `@keyframes`
on three conditions, enforced in code like the rest of the subset and not by
the prompt:

- Its `from`, `to` and percentage blocks are checked like any rule: every
  colour from a `var(--wa-*)` value, nothing that loads or is script-like.
  An animated colour is painted on the page as much as a static one, and the
  contrast check covers it only when it is one of the theme's values.
- A rule that starts an animation (`animation` or `animation-name`, also
  vendor-prefixed, any value but `none`, `!important` or not) sits inside
  `@media (prefers-reduced-motion: no-preference)`: every query in that
  list must hold the feature and none may be negated or joined with `or`,
  so the animation never runs for a user who asked for reduced motion.
  WCAG 2.1 AA asks for a way to stop motion that starts on its own (2.2.2);
  following the system preference goes beyond it, to 2.3.3.
- The name is a plain identifier: not a string, a CSS-wide keyword,
  `default` (no custom identifier may be one) or a keyword of the
  `animation` shorthand (such as `infinite` or `ease`), which the shorthand
  reads as that keyword and never as the name. The preview prefixes every
  keyframes name (`scopeCustomCSS()`), only where it stands as a name and
  never inside a function such as `steps()`, so a name cannot redefine one
  of Studio's own animations; the export writes it as proposed.

`@keyframes` may also sit inside `@media`, `@supports` or `@container`.
`@-webkit-keyframes` and every other at-rule stay refused.

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
