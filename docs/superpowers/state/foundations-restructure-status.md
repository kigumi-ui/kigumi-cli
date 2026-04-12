# Foundations Restructure - Live Status

**Last updated:** 2026-04-09 (Phase 4 complete)
**Tier 1 memory:** `~/.claude/projects/-Users-giregar-Documents-dev-git-kigumi-cli/memory/project-foundations-restructure.md`
**Spec:** `docs/superpowers/specs/2026-04-06-foundations-restructure-design.md`
**Phase 1 Plan:** `docs/superpowers/plans/2026-04-06-foundations-restructure-phase-1.md` (gitignored, local only, Phase 1 done)
**Phase 2 Plan:** `docs/superpowers/plans/2026-04-07-foundations-restructure-phase-2.md` (gitignored, local only, Phase 2 done)
**Phase 3 Plan:** `docs/superpowers/plans/2026-04-08-foundations-restructure-phase-3.md` (gitignored, local only, Phase 3 done)
**Phase 4 Plan:** `docs/superpowers/plans/2026-04-09-foundations-restructure-phase-4.md` (gitignored, local only, Phase 4 in progress)

---

## PR

`https://github.com/Siregar/kigumi-cli/pull/85` (draft)

---

## Current Phase: Phase 5 (Cascade Layers and Customizing) - not yet started

**State:** Phase 4 shipped the Color page with all six clusters (Surface, Text, Mix and Effect, Variant Roles, Variant Scale, Raw Palette) and three utility class groups. Foundations group now has 10 of 11 pages live (only Cascade Layers and Customizing remains). Phase 4 also added the new `Preview` primitive and retrofitted all Phase 2 and Phase 3 pages to use it, fixing the visual unrest issue called out during review of Phase 3. Branch is clean, draft PR is up to date. Ready for Phase 5 planning.

### Next Action

Open a new session, load Tier 1 + this file, and request a Phase 5 plan via the writing-plans skill. Phase 5 builds the Cascade Layers and Customizing page, which is the most conceptual page in the Foundations group and cross-references every cluster from Phase 2, 3, and 4.

---

## Phase 1: Setup & Primitives - COMPLETE

### Phase 1 Tasks - 12 of 12 COMPLETE

- [x] **Task 1:** Install dependencies (no commit)
- [x] **Task 2:** Update preview.ts sidebar order + theme decorator - commit `76ca2b1`
- [x] **Task 3:** Create \_internals folder + draft PR #85 (no commit, folder is empty and untracked)
- [x] **Task 4:** TokenTable + token-table.css - commits `3b567f9` (initial) + `970d3bb` (code review fixes: description modifier class + tokenized code padding)
- [x] **Task 5:** ColorSwatch + CSS append - commit `3b3a22d`
- [x] **Task 6:** SpaceSample + CSS append - commit `8655937`
- [x] **Task 7:** TypeSample (no CSS change) - commit `5fbd4ac`
- [x] **Task 8:** RadiusSample + CSS append - commit `495bda1`
- [x] **Task 9:** ShadowSample + CSS append - commit `7cb0003`
- [x] **Task 10:** MotionSample + CSS append (includes intentional `!important` on hover) - commit `ffc6199`
- [x] **Task 11:** StorybookPrimitives.stories.tsx with 7 stories - commit `b9704f5`
- [x] **Task 12:** Phase 1 validation + state update - this commit

### Phase 1 Commit Count: 12 (one initial TokenTable commit + one fix commit + 6 visual samples + 1 preview.ts + 1 story + 1 final state commit = 12 commits)

The plan originally estimated 10 commits but grew to 12: Task 4 needed a code review fix commit (`970d3bb`), and Task 12 added the final state commit. Both growth points were minor and expected.

### Decisions Made During Phase 1

- **Skipped unit tests entirely** - documented reasoning in plan: primitives are pure presentational, no logic to test beyond what type-check + build-storybook + visual review cover
- **Task 4 TokenTable had 2 code review findings** both fixed in commit `970d3bb`:
  1. Added `token-table__td--description` modifier class for future CSS targeting
  2. Replaced hard-coded `0.125rem 0.375rem` padding with `var(--wa-space-3xs) var(--wa-space-2xs)` tokens
- **Tasks 5-10 skipped full code quality review** - only spec compliance review was run, since: (a) the plan dictates each primitive verbatim, (b) Task 4 set the pattern, (c) Task 12's build-storybook serves as the final integration check
- **Task 11 skipped spec review** - type-check passed cleanly, which proves all primitive APIs match. The story file is pure composition with no logic. Task 12's build-storybook will do end-to-end verification
- **"Agent Skills" added to Guides sort order in Task 2** - incidental but correct fix (the page existed but wasn't in the sort order). Noted in PR description
- **Pre-existing lint error** `docs/src/kigumi-studio/contexts/StudioContext.tsx:539` (`react-hooks/refs` rule). Unrelated to Phase 1, verified pre-existing, leave for separate cleanup
- **Task 12 validation passed cleanly**: `pnpm tsc -b` clean, `pnpm lint` shows only the known StudioContext.tsx:539 pre-existing error, `pnpm build-storybook` succeeds (8.20s, includes `StorybookPrimitives.stories-CxCAhz3C.js` 12.08 kB and `StorybookPrimitives-CONcMeD1.css` 2.13 kB chunks confirming the new story file built). Manual visual review skipped (optional per session directive, build success serves as automated verification)

### Known Risks Still Open

- Color page length (~300 tokens when Phase 4 lands, mitigation: anchor links + collapsible Raw Palette)
- Alignment consolidation clarity (Phase 6, mitigation: per-section H2 + axis diagrams)
- Validation script correctness (Phase 8, needs its own tests)

---

## Phase 2: Token Pages Bundle - COMPLETE

### Phase 2 Tasks - 8 of 8 COMPLETE

- [x] **Task 1:** Pre-flight setup and MDX smoke test (no commit)
- [x] **Task 2:** Focus page - commit `66db362`
- [x] **Task 3:** Motion page - commit `d1476bb`
- [x] **Task 4:** Elevation page - commit `41dab94`
- [x] **Task 5:** Visibility page - commit `36c2ba9`
- [x] **Task 6:** Border & Radius page - commit `6bdee40`
- [x] **Task 7:** Spacing page - commit `9818acd`
- [x] **Task 8:** Phase 2 validation + state update - this commit

### Phase 2 Commit Count: 7

Six page commits plus one final state commit. No scope deviations from the plan. The plan was authored verbatim and pages were copied character-for-character.

### Decisions Made During Phase 2

- **Subagent-driven execution**: dispatched one Sonnet implementer subagent per page task plus a Sonnet spec compliance reviewer after each. Skipped code quality reviews for the page tasks since the content was verbatim from the plan with no design decisions to make (consistent with the Phase 1 pattern after Task 4 set the visual primitive shape).
- **Pre-existing lint error** `docs/src/kigumi-studio/contexts/StudioContext.tsx:539` (`react-hooks/refs`) remains unrelated and untouched. Lint exits non-zero because of it; this is the expected baseline.
- **Validation**: type-check (`pnpm tsc -b`) clean exit 0; lint shows only the known StudioContext error; `pnpm build-storybook` succeeds in ~10s with all 6 page chunks present in `storybook-static/assets/` (`Focus-*.js`, `Motion-*.js`, `Elevation-*.js`, `Visibility-*.js`, `BorderAndRadius-*.js`, `Spacing-*.js`).
- **Manual visual review skipped** in this execution session (build-storybook success serves as automated verification, consistent with Phase 1 Task 12).

---

## Phase 3: Heavy Pages - COMPLETE

### Phase 3 Tasks - 5 of 5 COMPLETE

- [x] **Task 1:** Pre-flight check (no commit)
- [x] **Task 2:** Typography page - commit `8dc4d4c`
- [x] **Task 3:** Native Elements page - commit `de49a07`
- [x] **Task 4:** Component Tokens page - commit `0fb9105`
- [x] **Task 5:** Phase 3 validation + state update - this commit

### Phase 3 Commit Count: 4

Three page commits plus one final state commit. No scope deviations from the plan. Page content was written verbatim from the Phase 3 plan.

### Decisions Made During Phase 3

- **Inline execution instead of subagent dispatch**: The plan anticipated subagent-driven execution (matching Phase 2). At execution time, Sonnet subagents returned HTTP 529 overload twice, and the user's memory feedback (feedback-model-routing.md) prefers subagents for read-only research only, not implementation. Switched to inline execution in the controller session: read the plan's Task 2/3/4 content sections directly and wrote the three MDX files using Write tool. This matches the "subagents are read-only only" rule and avoided the overload. Each page was verified with `pnpm tsc -b` and `pnpm build-storybook` before committing.
- **Phase 1 Internals sidebar fix shipped out-of-band** (commit `780d64f`, before Phase 3 started): `StorybookPrimitives.stories.tsx` previously appeared in the sidebar under an 'Internals' group. Added `tags: ['!dev', '!autodocs']` to the story meta and removed `'Internals'` from `preview.ts` storySort. Recorded here because it was a Phase 1 oversight caught during Phase 3 onboarding.
- **Pre-existing lint error** `docs/src/kigumi-studio/contexts/StudioContext.tsx:539` (`react-hooks/refs`) remains untouched, same baseline as Phase 1 and Phase 2.
- **Validation**: type-check (`pnpm tsc -b`) clean exit 0; lint shows only the known StudioContext error; `pnpm build-storybook` succeeds in ~9s with all 3 new chunks present (`Typography-*.js`, `NativeElements-*.js`, `ComponentTokens-*.js`).
- **Manual visual review skipped** in this execution session (build-storybook success serves as automated verification, consistent with Phase 1 and Phase 2).

---

## Phase 4: Color Page - COMPLETE

### Phase 4 Tasks - 9 of 9 COMPLETE

- [x] **Task 1:** Pre-flight check (no commit)
- [x] **Task 2:** Add Preview primitive - commit `734daf4`
- [x] **Task 3:** Retrofit Phase 2 pages to use Preview - commit `49847ec`
- [x] **Task 4:** Retrofit Phase 3 pages to use Preview - commit `c19ed0a`
- [x] **Task 5:** Color page scaffold + classes + small clusters + customizing - commit `9692cc6`
- [x] **Task 6:** Color page Variant Roles cluster - commit `8149de0`
- [x] **Task 7:** Color page Variant Scale cluster - commit `3af8261`
- [x] **Task 8:** Color page Raw Palette cluster - commit `4e40e3c`
- [x] **Task 9:** Phase 4 validation + state update - this commit

### Phase 4 Commit Count: 8

One Preview primitive commit + two retrofit commits + four Color page content commits + one final state commit. Task 1 is pre-flight only and does not commit.

### Decisions Made During Phase 4

- **Inline execution matched Phase 3 pattern.** No subagent dispatch; all writes happened in the controller session using Read + Edit + Write tools. Plan was read section-by-section via `offset`/`limit` to save context.
- **Preview primitive adopted as `figure`/`figcaption`.** Shape `<Preview label? tone? pad?>`, renders bordered container using `--wa-color-surface-raised` or `--wa-color-surface-lowered` (tone="muted"), optional uppercase caption bar via `figcaption.preview__label`. Lives in `docs/src/components/storybook/` next to the other Phase 1 primitives.
- **Retrofit was mechanical.** All 9 Phase 2/3 pages had their inline `<div style={{padding}}>` wrappers replaced with `<Preview>`. Where the wrapper had a meaningful className like `wa-stack` or `wa-cluster` with a `gap`, that className + gap moved to a new inner div so Preview handles padding/border/radius and the inner div handles layout. Elevation used `tone="muted"` to match its original surface-lowered background.
- **Plan bug caught in Task 5:** the plan's Color.mdx content used `<DocTable rows={[...]} />` without a `columns` prop, but `DocTable` requires both `columns` and `rows`. Fixed on the fly by adding `columns={[{ key: 'cls', header: 'Class' }, { key: 'description', header: 'Description' }]}` to each of the three `DocTable` instances in the Utility Classes section. No spec change needed since the plan is gitignored scratch state.
- **Per-cluster integration rhythm established.** Color page has no top-level `## Visual Reference` umbrella. Each of the 6 cluster h2 sections contains prose intro → `<Preview>` block → `<TokenTable>`. Future heavy pages (Phase 5 Cascade Layers) should follow the same rhythm.
- **Raw Palette hex values pulled verbatim from the source CSS.** All 110 step hex values were verified against `docs/node_modules/@awesome.me/webawesome-pro/dist/styles/color/palettes/default.css` lines 6-144 before writing. The `-key` rows use the numeric value (50, 60, 70, 80, 40 depending on hue). The `-gte-60` rows use the string `'computed via clamp'` and the `-on` rows use `'computed via color-mix for contrast'`, since both are derivations and not literal values.
- **Customizing snippet uses Kigumi purple brand scale.** The example at the bottom of the Color page uses the actual values from `docs/src/styles/theme.css` (e.g., `--wa-color-brand-50: #746abd`) so the snippet matches what the docs site already renders.
- **Manual visual review skipped** this session (build-storybook success serves as automated verification, consistent with Phase 1, 2, and 3).
- **Pre-existing lint error** `docs/src/kigumi-studio/contexts/StudioContext.tsx:539` (`react-hooks/refs`) remains untouched, same baseline as Phases 1-3.
- **Validation**: type-check (`pnpm tsc -b`) clean exit 0; lint shows only the known StudioContext error; `pnpm build-storybook` succeeds in ~10s with all 10 Foundations page chunks present (`Color-*.js`, `Focus-*.js`, `Motion-*.js`, `Elevation-*.js`, `Visibility-*.js`, `BorderAndRadius-*.js`, `Spacing-*.js`, `Typography-*.js`, `NativeElements-*.js`, `ComponentTokens-*.js`).

---

## Phase Log (across phases)

### Phase 0: Planning - COMPLETE

Spec + Phase 1 plan written and committed. Two-tier memory strategy set up. Draft PR created.

### Phase 1: Setup & Primitives - COMPLETE

All 7 primitives (`TokenTable`, `ColorSwatch`, `SpaceSample`, `TypeSample`, `RadiusSample`, `ShadowSample`, `MotionSample`) shipped and validated. `StorybookPrimitives.stories.tsx` composes all 7. Sidebar order and theme decorator updated. 12 commits on branch. Draft PR #85. Full details recorded under the Phase 1 section above.

### Phase 2: Token Pages Bundle - COMPLETE

6 pages live: Focus, Motion, Elevation, Visibility, Border & Radius, Spacing. Each uses the Phase 1 primitives and follows the five-section template. 7 commits added (6 page commits + 1 state commit). Full details recorded in the Phase 2 section above.

### Phase 3: Heavy Pages - COMPLETE

3 pages live: Typography, Native Elements, Component Tokens. Foundations group now has 9 of 11 pages live (Color and Cascade Layers remain). 4 commits added (3 page commits + 1 state commit). Full details recorded in the Phase 3 section above.

### Phase 4: Color Page - COMPLETE

Color page live with all six clusters (Surface, Text, Mix and Effect, Variant Roles, Variant Scale, Raw Palette) and three utility class groups. New Preview primitive shipped and adopted across all Phase 2 and Phase 3 pages. Foundations group now has 10 of 11 pages live. 8 commits added. Full details recorded in the Phase 4 section above.

### Phase 5+: See spec
