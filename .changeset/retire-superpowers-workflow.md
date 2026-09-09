---
'kigumi': patch
---

### Changed

Retire the superpowers state-file workflow in favour of the mattpocock-skills
engineering flow. `release-readiness` no longer parses `INITIATIVES.md` or the
test-infra cluster table: those meta-checks were pinned to `v0.20.0`, six minor
versions behind the current release, so they could not fail for a real reason.
The gate suite, changeset count and version-vs-tag comparison are unchanged, and
the report now lands in `.claude/reports/` instead of the repository tree.

### Removed

`scripts/state-files.ts`, `scripts/state-staleness.ts` and
`scripts/triage-finding.ts`, along with the `weekly-review` and `triage-finding`
skills; issue tracking moves to GitHub Issues.

`scripts/detemplate.ts`, a one-shot Handlebars migration tool whose own header
said it should be deleted once the migration shipped. No `.hbs` files remain and
handlebars is not a dependency.

`getProToken()` from `src/utils/tier.ts`, a pass-through wrapper around
`detectProToken()` with no callers outside its own tests.

`graphify-out/`, `docs/superpowers/` and `.claude/settings.local.json` are no
longer tracked. All three were already matched by `.gitignore` while remaining in
the index.
