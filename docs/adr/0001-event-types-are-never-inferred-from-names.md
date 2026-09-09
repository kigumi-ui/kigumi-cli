# Event types are never inferred from event names

Web Awesome's manifest gives each event a pascal-cased `eventName` (`blur`
becomes `BlurEvent`), which reads like a type but names no real DOM interface.
We previously derived handler types by pattern-matching that string in each
generator, which silently produced a different answer per framework: blur was
`FocusEvent` in React and `CustomEvent` in Vue and Angular, and `change`,
`input`, `load` and `error` were wrong in all three.

We decided that a handler's type is determined by the event's real DOM `name`,
through one table shared by all three generators: native events map to their DOM
interface, and `wa-`-prefixed custom events map to `CustomEvent` by an explicit
rule. No generator infers a type from a name-shaped string.

## Consequences

The event _type_ is framework-independent and lives in one place; the event
_name transformation_ (`onBlur`, `blurEvent`) stays per-framework, because that
genuinely differs. A new event needs a table entry, not a new branch in three
files.

This deliberately ignores the type Web Awesome declares in the manifest for some
events, which we currently discard for 34 of 140 events. Adopting those is
tracked separately and would change generated output again, notably for the 15
events whose declared type is an object shape.
