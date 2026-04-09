# Kigumi CLI Developer Onboarding — Design Spec

> Interactive audit structured as an onboarding. Understand each domain, then critically review it for fragility, bugs, dead code, and missing coverage.

## Context

Mischa vibe-coded most of kigumi-cli. It works on the surface, but the foundation's depth is unknown. 1000+ tests exist but likely cover mostly happy paths. Goal: understand the real state of each subsystem — connections, constraints, edge cases, and structural weaknesses — through a systematic domain-by-domain walkthrough. Nothing gets fixed during sessions (except critical hotfixes). All findings are logged to a 2nd brain file for follow-up tasking.

## Approach

**Option A (linear, dependency-ordered)** — 10 self-contained sessions, each covering one domain completely. Order follows prerequisite knowledge AND risk: understand the mental model and highest-risk domain early, so every subsequent session can ask "does this handle that correctly?"

Each session: ORIENT → UNDERSTAND → TRACE → AUDIT → LOG + SYNC

Context is cleared between sessions. Each session is fully self-contained — no prior context required beyond the checkpoint file.

## Session Order

| #   | Domain                               | Model | Effort   | Why                                                                       |
| --- | ------------------------------------ | ----- | -------- | ------------------------------------------------------------------------- |
| 1   | Mental Model + Live Demo             | Opus  | `high`   | Foundation for everything; trace `kigumi add button` live in a temp dir   |
| 2   | Tier System                          | Opus  | `max`    | Most opaque, runtime-detected, affects every domain — understand it early |
| 3   | Registry                             | Opus  | `high`   | Single source of truth; prerequisite for templates                        |
| 4   | Template System                      | Opus  | `high`   | Core value prop; most contributor-facing domain                           |
| 5   | Build Pipeline + Toolchain           | Opus  | `medium` | Now meaningful: you know what gets built and why                          |
| 6   | Config + Schema System               | Opus  | `high`   | Used everywhere; Zod types, cosmiconfig, auto-generated files             |
| 7   | Source Architecture                  | Opus  | `high`   | Module boundaries, layer map, commands anatomy, error handling            |
| 8   | Community Registry + Three-Way Merge | Opus  | `max`    | Most complex subsystem: snapshots, merge, topological sort                |
| 9   | Testing + Coverage Audit             | Opus  | `max`    | Hardest session: mapping what is NOT tested across all domains            |
| 10  | Active Roadmap + Open Specs          | Opus  | `medium` | Synthesis: 3 open specs, surface area review, next steps                  |

## Session Structure

Every session follows the same 5-step flow:

```
1. ORIENT     — Paste: "Kigumi onboarding, Session N: [Domain].
                Resume from ~/.claude/projects/kigumi-cli-onboarding-progress.md"
                Load checkpoint, confirm position, set expectations.

2. UNDERSTAND — Walk through the domain: core concept, key files, how it
                connects to domains already covered. Q&A, unlimited depth.

3. TRACE      — Follow a real execution path together. Actual commands,
                actual code, actual output. No abstractions.

4. AUDIT      — Systematic critical review: fragile patterns, edge cases,
                missing tests, dead code, suspicious behavior.

5. LOG + SYNC — Findings go into kigumi-cli-overview.md under the domain
                section. Checkpoint file updated: session marked done,
                RESUME HERE advanced to next session.
```

Rule: no fixes during sessions unless a critical hotfix. Everything else goes into the 2nd brain as a follow-up task.

## Persistent Files

### Checkpoint file (local only)

`~/.claude/projects/kigumi-cli-onboarding-progress.md`

Stays small. Readable in under 30 seconds. Contains the exact `/model` and `/effort` command for the next session plus a one-line paste-to-start string.

### 2nd brain (local only)

`~/.claude/projects/kigumi-cli-overview.md`

Grows session by session. Per-domain sections cover: health rating, key files, architecture summary, cross-domain connections, things every contributor must know, issues, and open questions. A `## Follow-up Tasks` section at the bottom aggregates the punch list after all sessions complete.
