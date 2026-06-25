# PLAN.md Template

Use this template to create implementation plans. Each phase should be achievable in one or two Claude Code sessions.

---

## Template

```markdown
# {Feature Name} — Implementation Plan

> Reference: [SPEC.md](./SPEC.md)

**Estimated effort:** {X phases, Y sessions}
**Prerequisites:** {list any blocking dependencies}

## Phase 1: Analysis & Setup

**Goal:** Verify assumptions from the spec and prepare the codebase.

**Tasks:**

- [ ] Read and understand the relevant existing code ({list specific files})
- [ ] Verify the spec's assumptions against the actual codebase
- [ ] Create the `specs/{feature-name}/` directory with SPEC.md and PLAN.md
- [ ] {Feature-specific setup tasks}

**Acceptance criteria:**

- [ ] No surprises found — spec assumptions hold
- [ ] OR: Spec updated with corrections from analysis

**Session boundary:** Single session. This phase is about reading, not writing.

---

## Phase 2: Core Implementation

**Goal:** Implement the feature's core logic.

**File targets:**

- Create: `{path/to/new/file.ts}`
- Modify: `{path/to/existing/file.ts}`

**Tasks:**

- [ ] {Task 1 — ordered by dependency}
- [ ] {Task 2}
- [ ] {Task 3}

**Acceptance criteria:**

- [ ] {Specific testable criterion}
- [ ] `pnpm build` succeeds
- [ ] `pnpm type-check` passes

**Session boundary:** {Single session / Multiple sessions — explain if multiple}

---

## Phase 3: Framework Wrappers

> Only for component features. Skip for CLI/Build/Infra.

**Goal:** Create wrapper templates for all supported frameworks.

**File targets:**

- Create: `templates/react/{ComponentName}/{ComponentName}.tsx`
- Create: `templates/react/{ComponentName}/{ComponentName}.jsx`
- Create: `templates/react/{ComponentName}/{ComponentName}.css`
- Create: `templates/react/{ComponentName}/{ComponentName}.test.tsx`
- Create: `templates/react/{ComponentName}/{ComponentName}.test.jsx`
- Create: `templates/vue/{ComponentName}/{ComponentName}.vue`
- Create: `templates/vue/{ComponentName}/{ComponentName}.js.vue`
- Create: `templates/vue/{ComponentName}/{ComponentName}.css`
- Create: `templates/vue/{ComponentName}/{ComponentName}.test.ts`
- Create: `templates/vue/{ComponentName}/{ComponentName}.test.js`
- Regenerate Angular: `pnpm tsx scripts/generate-angular-templates.ts`

**Tasks:**

- [ ] Use the `generate-component-wrapper` skill to create React templates
- [ ] Use the `generate-component-wrapper` skill to create Vue templates
- [ ] Verify templates match the spec's API surface
- [ ] Add registry entry to `src/utils/registry.ts`

**Acceptance criteria:**

- [ ] `pnpm validate:templates` passes
- [ ] `pnpm validate:registry` passes
- [ ] Generated components render without errors

**Session boundary:** Single session if using `generate-component-wrapper`. Two sessions if doing it manually.

---

## Phase 4: Testing

**Goal:** Verify the feature works end-to-end.

**File targets:**

- Create/Modify: `tests/unit/{feature}.test.ts`
- Create/Modify: `tests/integration/{feature}.test.ts` (if applicable)

**Tasks:**

- [ ] Write unit tests for core logic
- [ ] Write integration tests for CLI commands (if CLI feature)
- [ ] Test the generated output manually: `pnpm build && node dist/index.js {command}`
- [ ] Run the full validation suite: `pnpm build && pnpm test && pnpm lint && pnpm type-check`

**Acceptance criteria:**

- [ ] All new tests pass
- [ ] All existing tests still pass
- [ ] No type errors
- [ ] No lint warnings

**Session boundary:** Single session.

---

## Phase 5: Documentation & Validation

**Goal:** Ensure the feature is documented and the codebase is consistent.

**File targets:**

- Modify: `AGENTS.md` (if the feature changes architecture patterns)
- Modify: `src/AGENTS.md` (if new modules added)
- Modify: `templates/AGENTS.md` (if new template patterns)

**Tasks:**

- [ ] Update AGENTS.md if the feature introduces new patterns or modules
- [ ] Update the registry README if component categories changed
- [ ] Run `pnpm validate:parity` to check React/Vue template parity (for components)
- [ ] Final validation: `pnpm build && pnpm test && pnpm lint && pnpm type-check && pnpm validate:registry && pnpm validate:templates`

**Acceptance criteria:**

- [ ] All validations pass
- [ ] Documentation reflects the new feature
- [ ] SPEC.md updated with any deviations from the original plan

**Session boundary:** Single session.

---

## Rollback Plan

If the feature needs to be reverted:

- {What to revert — specific files and changes}
- {Whether a config migration is needed}
- {Impact on users who already installed the feature}

## Next Steps

After implementation is complete:

- [ ] {Follow-up tasks, e.g., "Add Solid.js support in a future iteration"}
- [ ] {Related features that are now unblocked}
- [ ] Mark SPEC.md status as "Implemented"
```

---

## Planning Tips

**Right-size your phases.** A phase with 2 tasks is too small (merge it). A phase with 15 tasks is too big (split it). 4-8 tasks per phase is the sweet spot.

**Be explicit about file targets.** "Modify the registry" is vague. "Add entry to `src/utils/registry.ts` in the `LOCAL_REGISTRY` object" is actionable.

**Session boundaries matter.** Claude Code has context limits. If a phase requires reading 20 files and writing 10, it probably needs two sessions. Say so, and explain the handoff point.

**Validation is not optional.** Every phase should end with at least `pnpm build && pnpm type-check`. The quality hook runs automatically, but the plan should make this explicit so an agent without hooks knows what to do.

**Connect to existing skills.** The plan should reference which Claude Code skills to use for each phase. For component wrappers, that's `generate-component-wrapper`. For theme-related work, that's `generate-theme-preset`. Don't reinvent what already exists.
