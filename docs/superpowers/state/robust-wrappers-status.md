# Robust Wrappers: Live Status

**Last updated:** 2026-05-03
**Feature scope:** Make the React/Vue/Angular wrappers more robust: fewer ad-hoc
error throws, typed error classes adopted, dead-code pruned in error paths.
**Position in roadmap:** Feature 3 of 5 (post-v0.20.0).

---

## Status

PENDING. Designed after v0.20.0 ships. No active implementation.

---

## Findings (from Backlog-Bankruptcy 2026-05-03 triage, category B: blocks this feature)

### F-079 (Latin Cluster C: errors-adoption-and-prune)

**Type:** dead-code medium
**Session:** 7
**Routed from:** Backlog-Bankruptcy 2026-05-03 with rationale `robust-wrappers-feature`
**Original entry:** see `~/.claude/projects/kigumi-cli-overview.md` (search `### F-079`)
**Summary:** 24 of 38 exported concrete error classes in `src/errors/` are never thrown anywhere in the codebase, and none are imported outside `src/errors/` either. The richly typed error taxonomy exists as dead surface area while raw `throw new Error(...)` sites throughout the codebase (see F-080) bypass the typed classes entirely.
**Why this blocks Robust Wrappers:** Cluster C is the typed-errors-adoption pass that the wrappers' error paths depend on.

### F-080 (Latin Cluster C: errors-adoption-and-prune)

**Type:** rule-violation medium
**Session:** 7
**Routed from:** Backlog-Bankruptcy 2026-05-03 with rationale `robust-wrappers-feature`
**Original entry:** see `~/.claude/projects/kigumi-cli-overview.md` (search `### F-080`)
**Summary:** Approximately 25 raw `throw new Error(...)` sites exist in production code (`github-fetcher.ts`, `registry-resolver.ts`, installer files, command files) where typed classes from `src/errors/` exist or should exist. Errors thrown as raw `Error` flow through `handleError` as `UnknownError` and lose the structured `code`, `exitCode`, and `suggestions` metadata that typed errors carry.
**Why this blocks Robust Wrappers:** same as F-079.

---

## Decisions Log

### 2026-05-03: F-079 and F-080 routed from Backlog-Bankruptcy

This state-file was created during Phase 1 of the Backlog-Bankruptcy initiative
to hold the routed B-category F-IDs for this feature.
