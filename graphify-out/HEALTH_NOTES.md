# Graph Health Notes

## Dangling-endpoint / collapsed-edge warning (2026-08-22)

The initial build's Step 4.5 diagnostic (`graphify.diagnostics.diagnose_extraction`)
reported ~3,390 dangling-endpoint edges and ~1,150 collapsed edges. That diagnostic
ran against the pre-build extraction (`.graphify_extract.json`), which is now deleted
by the normal build cleanup.

**Re-running the diagnostic directly against the current `graphify-out/graph.json`
shows zero dangling, zero missing-endpoint, zero self-loop, and zero collapsed edges.**
This is expected, not a bug: `graphify.build.build_from_json` explicitly filters out
edges whose source/target "does not match any node id" during the build/merge step
(`validate_extraction`'s dangling-edge check is intentionally non-fatal — see the
`# Dangling edges (stdlib/external imports) are expected` comment in `build.py`).

Root cause: AST extraction on this repo emits `imports`/`calls` edges pointing at
external packages (`react`, `@angular/core`, `rxjs`, etc.) and, plausibly, at
Angular `@Input()`/`@Output()` decorator targets that don't resolve to a node in the
corpus. These are dropped before `graph.json` is written, so the persisted graph
is clean. No extraction bug found; no code fix applied.

Takeaway for future queries: `graph.json` can be trusted for precise "does X call Y"
queries. If a future `--update` run's Step 4.5 diagnostic (which runs on the fresh
pre-build extraction) reports a similarly large dangling-edge count, re-check it
against the post-build `graph.json` before treating it as corruption — the two
numbers measure different things (raw extraction vs. build-filtered graph).

## Community-label instability across `cluster-only` / hook rebuilds (2026-08-22)

Louvain re-clustering (via `graphify cluster-only .`, and via the `_rebuild_code`
path the post-commit/post-checkout hooks call) is **not stable across runs** on
this graph: community IDs and even the total community count shift on every
re-cluster (observed 632 -> 819 -> 818 across three consecutive runs on an
unchanged or near-unchanged graph), and each shift causes graphify's own
hub-based label-carryover to silently replace a chunk of the previously
hand-written plain-language community names with filename-fallback labels
(e.g. "add/index.ts" instead of "Add Command Core"). This happened three times
during this session's labeling work, each time discarding tens to a few hundred
curated names.

Practical implications:

- **Any commit that changes code files and triggers the post-commit hook can
  silently degrade community label quality.** The hook itself calls the same
  re-clustering path.
- There is no cheap way to prevent this from graphify's current CLI surface;
  the fix applied here was to re-detect degraded labels (single-word or
  filename-shaped label on a community with 3+ nodes) and re-derive names from
  the community's node-id patterns after every rebuild.
- If `GRAPH_REPORT.md`'s "Community Hubs" section starts showing raw file
  paths or `Community N` again after a future commit, that is this known
  behavior, not new corruption — re-run the label-recovery pass (majority-vote
  node-overlap against the last known-good `.graphify_labels.json`, or a fresh
  pattern-based relabel) rather than treating it as a regression to debug.
