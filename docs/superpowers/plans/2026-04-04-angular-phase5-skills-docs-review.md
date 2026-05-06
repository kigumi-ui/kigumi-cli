# Angular Phase 5 Plan -- Retrospective Review

**Subject:** [`2026-04-04-angular-phase5-skills-docs.md`](./2026-04-04-angular-phase5-skills-docs.md)
**Spec:** [`docs/superpowers/specs/2026-04-04-angular-phase5-skills-docs-design.md`](../specs/2026-04-04-angular-phase5-skills-docs-design.md)
**Reviewed:** 2026-05-06
**Reviewer:** retrospective audit

---

## Summary

Phase 5 is functionally shipped. Eight of ten tasks landed (likely as part of cluster α, commit `e59a8229`): the `kigumi-angular` skill, its eval suite, the four `*-angular.md` references in the compose skills, and the angular cross-refs in all four AGENTS.md files all exist and look healthy. The generator produces `.claude/skills/shared/angular-api-surface.md` from real Angular template files.

What did **not** age well is the plan document itself. It was written before the Handlebars removal in PR #121 (`d6004f7`), and every passage that references `.component.ts.hbs`, the `verifyAngularEventNames` helper, or the 639-line generator is now incorrect. Anyone trying to re-execute this plan today would chase symbols that no longer exist. The two remaining unfinished tasks (`ng build` validation and visual integration in `kigumi-angular-starter`) sit in an external repo and cannot be verified from here.

**Recommendation:** archive the plan in place with a banner pointing to this review (option (a) below). Don't rewrite it -- losing the audit trail of what was originally proposed is a net negative.

---

## Status table

Verified by reading the repo on 2026-05-06.

| #   | Plan task                                            | Status        | Evidence                                                                                                                                |
| --- | ---------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Generator extension (`generateCompactAngularSurface`) | DONE (different impl) | `scripts/generate-skill-references.ts:587` (`extractAngularOutputMap`), `:663` (`detectCVAComponents`), `:691` (`generateCompactAngularSurface`); 867 lines total |
| 2   | `kigumi-angular` SKILL.md                            | DONE          | `.claude/skills/kigumi-angular/SKILL.md` -- 331 lines, frontmatter present, `user-invocable: true`                                        |
| 3   | `kigumi-angular` evals.json                          | DONE          | `.claude/skills/kigumi-angular/evals/evals.json` -- 11 entries (plan promised 10-12)                                                      |
| 4   | `compose-layout` Angular reference                   | DONE          | `.claude/skills/kigumi-compose-layout/references/layout-archetypes-angular.md`                                                          |
| 5   | `compose-form` Angular reference                     | DONE          | `.claude/skills/kigumi-compose-form/references/form-patterns-angular.md`                                                                |
| 6   | `compose-overlay` Angular reference                  | DONE          | `.claude/skills/kigumi-compose-overlay/references/overlay-patterns-angular.md`                                                          |
| 7   | `compose-data` Angular reference                     | DONE          | `.claude/skills/kigumi-compose-data/references/data-patterns-angular.md`                                                                |
| 8   | AGENTS.md updates (root, src, templates, tests)      | DONE          | `AGENTS.md:94` (skill table), `:210-238` (Angular rules 8-11), `:454` (`tpl_angular`); `src/AGENTS.md:108,170,244-246`; `templates/AGENTS.md:32-35,345,377`; `tests/AGENTS.md:583-589` |
| 9   | `ng build` validation in `kigumi-angular-starter`    | UNVERIFIABLE  | External repo (`~/Documents/dev/git/kigumi-angular`); cannot be confirmed from `kigumi-cli`                                             |
| 10  | Visual integration pass via Chrome DevTools MCP      | UNVERIFIABLE  | Same -- depends on the external starter repo                                                                                              |

---

## Drift findings

Every item below is something a future re-executor or onboarding agent would trip over.

### 1. Whole-stack drift: Handlebars removed, plan still assumes it

**Severity:** blocker for re-execution; safe to ignore for "reading the history."

The plan header asserts:

> **Tech Stack:** TypeScript, Handlebars templates, Angular 17+ standalone components, Web Awesome web components, pnpm

PR #121 (`feat(templates): remove Handlebars`, `d6004f7`) deleted every `.hbs` file. `find templates -name '*.hbs'` returns nothing today. The Angular templates are now plain Angular files:

```text
templates/angular/Button/
  button.component.css
  button.component.spec.ts
  button.component.ts
```

The plan references `.component.ts.hbs` paths in **at least 18 places** (`grep -n '\.hbs' ...plan.md`), including:

- Task 1, Step 3 -- invents `verifyAngularEventNames` to "read Angular `.component.ts.hbs` templates" (line 91)
- Task 1, Step 4 -- passes `kebab.component.ts.hbs` paths into `detectCVAComponents` (line 179)
- Task 6 -- "Cross-check each against the actual `.hbs` template `@Output()` names" (line 347)
- Task 6, Step 2 -- bullet list of "Templates" pointing at `templates/angular/Button/button.component.ts.hbs` etc. (lines 393-396, 1030-1033, 1096-1099)

**Fix:** replace `.component.ts.hbs` -> `.component.ts` throughout, and rewrite the tech-stack line.

### 2. Task 1 line numbers and helper signatures don't match the current generator

**Severity:** blocker for re-execution.

Plan claim (line 54):

> The script (639 lines) already generates React and Vue surfaces...

Current `scripts/generate-skill-references.ts` is **867 lines**.

Plan invents two helpers -- `verifyAngularEventNames` and `deriveAngularBaseName` -- that parse `@Output()` declarations from `.hbs` files. The actual implementation is:

| Plan symbol                  | Plan signature                                                                     | Real symbol                                                              | Real signature / location                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `verifyAngularEventNames`    | `(ceMap, registry) => Promise<Map<string, Map<string, string>>>`                   | `extractAngularOutputMap`                                                | `(): Promise<Map<string, Map<string, string>>>` at `scripts/generate-skill-references.ts:587`            |
| `deriveAngularBaseName`      | helper that strips `wa-` and camelCases                                            | _not present_                                                            | naming is inferred at runtime from regex matches against the template source `.component.ts` files in `templates/angular/` |
| `detectCVAComponents`        | `(registry) => Set<string>` reading `.component.ts.hbs`                            | `detectCVAComponents`                                                    | `(): Promise<Set<string>>` at `:663`, reads `.component.ts`                                              |
| `generateCompactAngularSurface` | `(components, angularEventMap, cvaComponents)`                                  | `generateCompactAngularSurface`                                          | `(ceMap, angularOutputMap, cvaComponents)` at `:691`                                                     |

The actual approach is fundamentally different from the plan: instead of parsing `@Output()` declarations from a template, `extractAngularOutputMap` regex-matches `addEventListener('event', ... this.X.emit)` calls inside the template source `.component.ts` files in `templates/angular/` (line 614). That choice is reasonable, but a re-executor following the plan would write the wrong helper.

**Fix:** rewrite Task 1's "Step 2 / Step 3 / Step 4" code blocks to describe what's actually in the file, or strike them out and replace with a "see current generator" pointer.

### 3. Hardcoded absolute user paths in Tasks 7-10

**Severity:** cosmetic, but actively annoying.

Examples:

```bash
cd /Users/giregar/Documents/dev/git/kigumi-cli   # plan line 331, 1326, 1375, 1482
cd ~/Documents/dev/git/kigumi-angular            # 1313, 1329, 1350, 1387, 1444, 1492
```

These leak `giregar` into a committed doc. The non-tilde form would also fail for any other engineer.

**Fix:** use `cd "$KIGUMI_CLI_ROOT"` / `cd "$KIGUMI_ANGULAR_ROOT"` (or just relative `cd ../kigumi-angular`).

### 4. "Last Updated 2026-04-04" instruction is dead

**Severity:** cosmetic.

Plan, Task 8 Step 6 (line 1284):

> Update the "Last Updated" date at the bottom of each modified AGENTS.md file to `2026-04-04`.

Today (2026-05-06) those dates have moved on:

| File                | Last Updated                                            |
| ------------------- | ------------------------------------------------------- |
| `AGENTS.md`         | `2026-05-04`                                            |
| `src/AGENTS.md`     | `2026-05-03 (cluster A: config load/validate/save lifecycle)` |
| `templates/AGENTS.md` | `2026-05-02`                                          |
| `tests/AGENTS.md`   | `2026-05-04 (cluster U: story play() interactions ...)`   |

Since the AGENTS.md angular cross-refs are already in place, this step is a no-op now. **Fix:** strike it from the plan.

### 5. `tests/AGENTS.md` says "10 eval prompts," `evals.json` has 11

**Severity:** cosmetic; one of the two needs to budge.

```text
tests/AGENTS.md:585
- `.claude/skills/kigumi-angular/evals/evals.json` -- 10 eval prompts covering ...

grep -c '"id":' .claude/skills/kigumi-angular/evals/evals.json
11
```

Pick one and align the other. The plan's own `10-12` window covers both numbers.

### 6. SKILL.md `allowed-tools` -- non-finding (closed)

Initially flagged as a possible drift item: `kigumi-angular/SKILL.md:10` declares `allowed-tools: Read, Glob, Bash`, which seems heavy for a read-only conversion skill. Cross-checked against the sibling skills:

- `.claude/skills/kigumi-react/SKILL.md:9` -- `allowed-tools: Read, Glob, Bash`
- `.claude/skills/kigumi-vue/SKILL.md:10` -- `allowed-tools: Read, Glob, Bash`

All three conversion skills declare the same set, so this is intentional framework-level policy, not a per-skill anomaly. No action required.

### 7. Plan location vs. CLAUDE.md guidance

**Severity:** cosmetic / process.

`CLAUDE.md` says superpowers plans go in `.claude/plans/` (gitignored). This plan lives at `docs/superpowers/plans/` and is committed. The user's auto-memory entry `feedback-plans-not-in-git` says the same. The actual `.gitignore` only excludes `.claude/plans/`, and `docs/superpowers/plans/2026-04-04-angular-phase5-skills-docs.md` is tracked -- so either the rule is "specs + cross-cutting plans are committed, scratch plans are not," or the rule changed. Worth one sentence of clarification in CLAUDE.md so future agents aren't confused.

This review is being saved alongside the plan it reviews, in `docs/superpowers/plans/`, on the assumption that the existing pattern wins.

---

## Open work

Tasks 9 and 10 cannot be verified from inside `kigumi-cli`:

- **Task 9 -- `ng build` validation in `kigumi-angular-starter`.** Plan, line 1308:
  > The Angular starter at `~/Documents/dev/git/kigumi-angular/` currently has only 4 components installed (Button, Card, Icon, Input) despite `kigumi.config.json` claiming 73.

  Whether this is still true is unknown from this repo. The validation flow (install components, paste skill outputs, `ng build`) lives in the external starter.

- **Task 10 -- Visual integration pass via Chrome DevTools MCP.** Same constraint.

**Recommendation:** track these as a follow-up item against the `kigumi-angular-starter` repo, not retroactively against this plan. The Phase 5 plan should be considered closed once the doc-drift in findings 1-5 and 7 is addressed; "the starter still needs an end-to-end visual pass" is a Phase 6 concern. The spec already calls out Phase 6 (`docs/superpowers/specs/2026-04-04-angular-phase5-skills-docs-design.md:257`) -- fold it in there.

---

## Recommendation

**(a) Archive in place with a banner. ← default**

Add a short note at the top of `2026-04-04-angular-phase5-skills-docs.md`:

> **Status (as of 2026-05-06):** Tasks 1-8 shipped (likely as part of cluster α, commit `e59a8229`). Tasks 9-10 are external to this repo. This document has not been updated to reflect the post-Handlebars-removal reality (PR #121, `d6004f7`); see [retrospective review](./2026-04-04-angular-phase5-skills-docs-review.md) for current state and drift items.

This preserves the audit trail of what was originally proposed and how the implementation diverged.

**(b) Rewrite the plan in place.**

Only worth it if you expect to re-execute Tasks 9-10 from this document. Loses the original framing.

---

## How this review was verified

Each "DONE" row in the status table cites a path. A reader can `Read` each one to spot-check. The drift findings each include the plan line number and the corresponding repo file/path. The Handlebars claim is verifiable via:

```bash
find templates -name '*.hbs'           # -> no output
git show --stat d6004f74 | head -5     # -> "feat(templates): remove Handlebars"
```

Generator-shape claims verified by reading `scripts/generate-skill-references.ts:560-700`.

Note: `pnpm tsx scripts/generate-skill-references.ts` was **not** run as part of this review (it would rewrite the generated surface files). A future reader who wants a freshness check can run it and diff `.claude/skills/shared/angular-api-surface.md`.
