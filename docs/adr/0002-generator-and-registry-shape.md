# One generator per framework, one file for the registry

Two parts of this codebase look like duplication or bloat and have been proposed
for consolidation more than once. Both shapes are deliberate.

**Three generators stay three generators.** React, Vue and Angular output is
structurally different: JSX props, single-file-component blocks, and decorator
classes. What is genuinely shared already lives in `scripts/generator-utils.ts`,
and shared logic belongs there. Merging the generators themselves would trade
three readable emitters for one branching on framework at every step.

**`src/utils/registry.ts` stays one file.** It is large, roughly 5,600 lines,
and near the top of the churn list, which makes it look like a problem. It is
one data literal describing every component behind five small accessors. The
churn is data churn: new components and props. Splitting it would spread a
single source of truth across many files and buy nothing.

## Consequences

Adding a framework means writing a generator, not extending a matrix. Adding a
component means editing one file. An architecture review that flags either as
duplication or as a god-file should read this first.
