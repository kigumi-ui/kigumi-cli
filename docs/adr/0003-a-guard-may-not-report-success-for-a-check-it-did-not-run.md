# A guard may not report success for a check it did not run

Twice now a validator has shipped the same defect: a module could not reach its
input, returned an empty result, and its caller read empty as "nothing wrong".
Both times the guard printed a green pass and exited 0 while verifying nothing.

**Issue #43: `validate:generated-fresh` Check A.** The check that catches
"generator changed, templates not regenerated" was gated on a CEM probe that
only looked in `docs/node_modules` for the Pro package. CI installs neither, so
Check A skipped on every run for months, printing
`Generated-artifact freshness check passed!` directly beneath its own skip
notice.

**`validate:cem-sync`, the prop-value half.** `getCemAttributeTypes()` returned
an empty map when the manifest was unreachable ("degrades to a no-op rather
than failing", per its own docblock). `checkPropValueDrift` read empty as
nothing-to-compare and returned early, and the report printed
`Prop-value drift: 0`, the same `0` as a clean run across all 84 components.
Two runs with and without the manifest on disk produced byte-identical output.
The half exists because Web Awesome 3.6.0 widened a `size` enum and nobody
noticed; it had itself been silent ever since.

Both were found by inspection, not by failure. That is the point: this defect
class cannot announce itself, because the only symptom is a green run.

## The rule

A guard reports three outcomes, not two: **passed**, **failed**, and **did not
run**. The third may never be presented as the first.

Concretely:

- **Absence of an input is a distinct state.** A resolver reports what it found
  (`resolveCem` returns `found`, `tier`, `componentCount`); it does not decide
  what absence means.
- **The caller decides the policy, and may not map absence onto success.**
  Check A regenerates every template, so a partial manifest makes it dishonest
  and is refused. A generator that merely enriches its output may legitimately
  continue without one. What neither may do is stay quiet.
- **"Did it pass" and "did it actually run" are separate fields.**
  `GuardSummary` carries `exitCode` and `verified` independently, and only a
  fully verified, finding-free run may print an unqualified pass headline.
- **A number that looks like evidence must come from the evidence.**
  `validate:cem-sync` printed `CEM components: 84` from the committed
  `COMPONENT_METADATA`, not from any manifest, so it printed 84 with no CEM on
  disk at all. It is now labelled `Metadata components`.
- **Skip where a dependency is legitimately absent; fail where its absence
  means something is broken.** `skipPermitted` tolerates a missing Pro package
  outside CI and on fork pull requests, which receive no secrets, and refuses
  everywhere else. A tolerated skip is still reported as `NOT verified`.
- **In tests, a skip is `ctx.skip()`.** A test that silently passes because its
  premise was absent is the same defect wearing a different hat.

## Prior art

The shape is well understood outside this repo.

The [Monitoring Plugins guidelines](https://www.monitoring-plugins.org/doc/guidelines.html)
define exit codes 0/1/2 as OK/Warning/Critical, all three meaning _"the plugin
was able to check the service"_, and reserve **3 (Unknown)** for failures that
"prevent it from performing the specified operation". Inability to check has its
own code because it is not a result.

[TAP](https://testanything.org/tap-version-14-specification.html) counts a
`# SKIP` point as skipped rather than passed, and says harnesses "should report
`SKIP` test points found as a list of items that were not tested".

pytest's maintainers
([pytest-dev/pytest#1364](https://github.com/pytest-dev/pytest/issues/1364))
refused a built-in "fail on skip" and recommended choosing at the call site
(skip locally, fail on CI) after a reporter described a CI bug that stopped
dependencies installing: _"pytest was quietly skipping them and we didn't even
know because we were happy with the green builds."_

We deliberately did **not** adopt a distinct exit code. Nothing in this repo
reads beyond zero/non-zero, and a second convention would only let the two
guards disagree. The distinction is carried by `verified`.

## Consequences

`scripts/guard-outcome.ts` owns this vocabulary (`summarizeGuard`,
`GuardSummary`, `skipPermitted`) and both CEM-dependent guards consume it. A
third guard that needs a manifest uses it too rather than writing its own
reporting.

A check that cannot run in CI must either be given what it needs (the
`freshness` job installs Pro for exactly this reason) or fail. "It self-skips
when the input is absent" is not a justification; it is a description of the
bug.

When reviewing a guard, the question is not "does it pass" but "what did it
compare, and would the output differ if it had compared nothing". If those two
runs look the same, the guard is not a guard.

## Why there is no lint rule for this (issue #47)

Issue #47 asked whether this rule could be enforced mechanically instead of by
review. It cannot, and the reason is worth recording so it is not re-litigated.

**The defect and the correct pattern are syntactically identical.** The
`validate:cem-sync` defect, in full, was:

```ts
const out = new Map();
const cemPath = findCustomElementsJsonSync();
if (!cemPath) return out; // empty accumulator, early return
```

And here is correct code from the same directory:

```ts
const findings: Finding[] = [];
if (nothingToCheck) return findings; // empty accumulator, early return
```

`scripts/` contains **11** guarded early returns of an empty accumulator:

```
validate-cem-sync.ts:239          if (cemAttrTypes.size === 0) return findings;
generate-angular-templates.ts:111 if (!metadata?.events) return [];
generate-angular-templates.ts:125 if (!metadata?.methods) return [];
validate-fixture-exclusions.ts:106 if (!match) return [];
check-generated-fresh.ts:235      if (!(await fs.pathExists(docsUiDir))) return findings;
check-generated-fresh.ts:275      if (!(await fs.pathExists(reactDir))) return findings;
check-generated-fresh.ts:316      if (!(await fs.pathExists(fixturesRoot))) return findings;
check-generated-fresh.ts:362      if (!(await fs.pathExists(llmsPath))) return findings;
post-changeset-version.ts:157     if (next === undefined) return out;
validate-story-lanes.ts:67        if (!block) return [];
validate-registry.ts:95           if (!Array.isArray(component.props)) return errors;
```

Exactly one was the bug. A syntactic rule keyed on this shape would produce ten
false positives, and the noise would be worse than the defect: a rule that is
suppressed everywhere teaches people to suppress it.

Read the list rather than the count. `validate-cem-sync.ts:239` is the _fixed_
cem-sync guard, and the four `check-generated-fresh.ts` entries return empty
when a path is absent. All eleven are indistinguishable, as text, from the
defect.

The irony is sharpest in the most correct code in the repo.
`checkGeneratorFreshness` returns `{ findings: [], cem }` when the manifest is
unusable: an empty-accumulator early return that a syntactic rule would flag,
written specifically to obey this ADR.

**A type-aware rule is not available either.** Distinguishing the two cases
needs to know that `out` is an _input_ the caller will treat as evidence, not a
_result_. That is a dataflow question, and ESLint cannot answer it here:
`eslint.config.js` wires no `parserOptions.project` anywhere in the repo, so
type-aware rules do not run there at all. `@typescript-eslint`'s
`no-unnecessary-condition` and the `strict-boolean-expressions` family are
adjacent but target nullability, not this.

**The narrower alternative is not worth its keep.** Issue #47 suggested
requiring that a resolution type's `found` field be read before its payload.
That is mechanical, but the repo contains exactly **one** such type
(`CemResolution`), with five consumers, and all five already discriminate:
four on `resolution.path`, one on `resolution.found`, one further via
`assessCemCompleteness(...).usable`. A rule policing one type with five correct
call sites is overhead, not a guard.

**What actually prevents recurrence** is the funnel, not a linter. `resolveCem`
is the single way to locate a manifest and it reports what it found rather than
deciding what absence means; `guard-outcome.ts` owns `verified` separately from
`exitCode`. Both defects were possible because each caller made its own
decision about absence. Neither can recur without deleting that seam, which is
a visible change in review, unlike the silent pass, which was not.

Reconsider this only if a second resolution type appears, or if `scripts/` gains
a type-aware ESLint project. Until then, the review question in the previous
section is the enforcement.
