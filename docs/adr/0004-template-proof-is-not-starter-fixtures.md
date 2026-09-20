# Template proof is not Starter fixtures

Adding a Template looks as if it might be proven by growing the Starter
fixture set: those fixtures already typecheck and build in a real consumer.
That would make Starter fixtures the catalogue of Template correctness, which
they are not. They are install smoke against a fixed nine-component contract
with the starter repositories.

Function and types are two seams, not one. Function is proven on the committed
TypeScript Template under a stubbed Web Awesome load: CEM shape plus Kigumi
adapter invariants. Types are proven on the files that `kigumi init` then
`kigumi add --all` write into an ephemeral consumer, typechecked strictly
against the real package. Mixing the two either couples function to a Pro
token or typechecks shims instead of user files.

## Considered Options

**Catalogue-in-starters** (rejected): add every new Template to the Starter
list and regenerate Starter fixtures. That grows an integration contract into
a second Registry, blocks Template work on starter clones, and still does not
prove Template event wiring, listener cleanup, or CVA. The Starter job
typechecks and builds; it does not assert CEM wiring.

**Function and types on Starter fixtures** (rejected for the same reason): the
fixtures cover nine components and record installer byte-stability, not
Template behaviour.

## Consequences

The nine-component Starter job and Starter fixtures stay as they are. Adding a
Template does not regenerate them and does not edit the Starter component
list. Generated-fresh Check D (Starter fixture CSS vs Template CSS) remains a
CSS drift guard, not function or type proof.

A later change that "fixes" missing catalogue coverage by adding every
component to the starters is reversing this decision.
