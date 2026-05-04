# Studio Export Fix: Live Status

**Last updated:** 2026-05-03
**Feature scope:** Fix Kigumi Studio export emitting duplicate CSS custom properties (e.g.,
the same `--wa-` variable appearing multiple times in the output).
**Position in roadmap:** Feature 1 of 5 (post-v0.20.0).

---

## Status

PENDING. Designed after v0.20.0 ships. No active implementation.

---

## Findings (from Backlog-Bankruptcy 2026-05-03 triage, category B: blocks this feature)

### F-077 (Latin Cluster D: theme-subcommands)

**Type:** bug medium
**Session:** 7
**Routed from:** Backlog-Bankruptcy 2026-05-03 with rationale `theme-studio-export-feature`
**Original entry:** see `~/.claude/projects/kigumi-cli-overview.md` (search `### F-077`)
**Summary:** `listCommand` and `showCommand` exist as fully-formed Commander objects in `src/commands/theme/list.ts` and `src/commands/theme/show.ts` but are never registered with the parent `themeCommand` in `theme.ts`. Running `kigumi theme list` or `kigumi theme show` produces an unknown-command error even though the action handlers are implemented and ready.
**Why this blocks Studio Export:** the theme-subcommands cluster touches
the same export pipeline that emits CSS custom properties.

---

## Decisions Log

### 2026-05-03: F-077 routed from Backlog-Bankruptcy

This state-file was created during Phase 1 of the Backlog-Bankruptcy initiative
to hold the routed B-category F-IDs for this feature.
