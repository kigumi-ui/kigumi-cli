---
'kigumi': patch
---

### Fixed

- Generator drift can no longer reach `main` with green CI. `validate:generated-fresh` Check A resolved its Custom Elements Manifest through a probe that searched only `docs/node_modules` and only for the Pro package, so it found nothing on every CI run and printed "freshness check passed!" directly beneath its own skip notice. A generator change that altered template output without regenerating templates passed all eleven validators and the full unit suite while the five path-filtered jobs skipped, because a `scripts/`-only changeset matched no filter. Check A now requires a manifest describing every registry component, reports an unverified run as unverified, and runs in its own ungated CI job.
- The skill-reference generator no longer degrades silently. It carried a second, divergent manifest finder that walked up to the main worktree via `git rev-parse --git-common-dir`; inside the freshness guard's temporary copy there is no `.git`, so it generated without enrichment and emitted 45% smaller API-surface files with every `Methods` and `Parts` line missing. It now shares `resolveCem`, refuses an incomplete manifest, and exits non-zero on failure instead of printing the error and reporting success.
