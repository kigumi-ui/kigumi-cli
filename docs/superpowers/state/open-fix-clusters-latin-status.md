# Open Fix Clusters (Latin): Live Status

**Last updated:** 2026-05-03
**Convention:** this initiative groups remaining open F-IDs from the 10-session
audit into Latin clusters A through J. Each cluster ships as its own PR.

---

## Cluster Status Table

| Cluster | Codename                      | F-IDs                                                                | Status                   | PR   |
| ------- | ----------------------------- | -------------------------------------------------------------------- | ------------------------ | ---- |
| **A**   | config-lifecycle-hardening    | F-033, F-054, F-055, F-056, F-057, F-058, F-059, F-062, F-065, F-067 | **SHIPPED**              | #152 |
| **B**   | schema-cleanup                | F-060, F-061, F-063, F-064, F-066                                    | **SHIPPED**              | #134 |
| **C**   | errors-adoption-and-prune     | F-062, F-079, F-080                                                  | PENDING                  | -    |
| **D**   | theme-subcommands             | F-077, F-078, F-085, F-086                                           | PENDING                  | -    |
| **E**   | read-only-command-uniformity  | F-082, F-083, F-084, F-087                                           | PENDING                  | -    |
| **F**   | checks-output-layer-trim      | F-088, F-089, F-091                                                  | PENDING                  | -    |
| **G**   | build-and-release-pipeline    | F-042, F-043, F-044, F-048, F-049                                    | PENDING (blocks v0.20.0) | -    |
| **H**   | ci-and-test-config            | F-045, F-046, F-050, F-051                                           | PENDING                  | -    |
| **I**   | validation-tooling-tightening | F-047, F-052                                                         | PENDING                  | -    |
| **J**   | source-architecture-cleanup   | F-081, F-090, F-092, F-093                                           | PENDING                  | -    |

**Status legend:** SHIPPED, IN-PROGRESS, PENDING, BLOCKED.

---

## Findings (from Backlog-Bankruptcy 2026-05-03 triage, category A: blocks v0.20.0)

These F-IDs were routed here from the bankruptcy triage as v0.20.0-blocking. Their
full text remains in `~/.claude/projects/kigumi-cli-overview.md` under the
"Follow-up Tasks: Migrated" section.

### F-042 (Cluster G)

**Type:** quality medium
**Session:** 5
**Routed from:** Backlog-Bankruptcy 2026-05-03 with rationale `build-release-pipeline-blocks-v0.20.0`
**Original entry:** see `~/.claude/projects/kigumi-cli-overview.md` (search `### F-042`)
**Summary:** The published tarball includes `templates/` twice: once at package root via the `files` array, and once as a redundant copy inside `dist/templates/` written by `post-build.ts`. The runtime always reads from the package-root copy, making `dist/templates/` dead weight that bloats every install by ~4 MB.

### F-044 (Cluster G)

**Type:** bug medium
**Session:** 5
**Routed from:** Backlog-Bankruptcy 2026-05-03 with rationale `build-release-pipeline-blocks-v0.20.0`
**Original entry:** see `~/.claude/projects/kigumi-cli-overview.md` (search `### F-044`)
**Summary:** The `prebuild` script only regenerates `component-metadata.ts` when the file is missing, not when it is stale. A contributor who bumps the WA Pro package and runs `pnpm build` without first running `pnpm generate:metadata` silently ships wrappers missing any new props or events added in the upgraded CEM.

---

## Decisions Log

### 2026-05-03: Cluster A SHIPPED in PR #152

10 F-IDs addressed. See PR #152 description for the full list.

### 2026-05-03: Cluster B SHIPPED in PR #134

10 F-IDs addressed (F-054, F-060, F-061, F-062, F-063, F-064, F-065, F-066, F-067, F-132). Some overlap with Cluster A's PR #152.

### 2026-05-03: Cluster G (build-release-pipeline) prioritized as next

F-042, F-044 routed here from Backlog-Bankruptcy as v0.20.0-blocking. Cluster G
should ship before v0.20.0 final. Other clusters (C, D, E, F, H, I, J) remain
pending without explicit priority.

---

## Open Questions

- Should Cluster G (build-release) get its own PR before T finishes, or be folded into the v0.20.0 release prep PR?
- Cluster C overlaps F-062 with Cluster A/B (already shipped). Verify F-062 is no longer in scope.
