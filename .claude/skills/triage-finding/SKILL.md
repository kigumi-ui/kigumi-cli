---
name: triage-finding
description: >
  Evaluate a finding (file path, description, severity guess) against
  the 3-criteria new-finding rule (not fixable in same PR / blocks
  v0.20.0 or feature or test-layer / at least medium severity) and
  produce a draft in the appropriate format: state-file Issue entry,
  PR-description bullet, or wontfix acknowledgement. Use during code
  review when a finding surfaces and the question is "track or skip?"
user-invocable: true
allowed-tools: Read, Bash, Grep
---

# Triage a Finding

Walk a finding through the 3-criteria rule from backlog-bankruptcy Phase 1. Produce a draft the user can paste into the appropriate location.

## The 3 criteria

1. **K1**: The finding is not fixable in the current PR.
2. **K2**: The finding blocks at least one of:
   - v0.20.0 release confidence (initiative-acceptance criterion)
   - A concretely planned or active feature (Studio export fix, per-framework storybook, robust wrappers, custom patterns, storybook tests)
   - Test-layer completeness (Q1/Q2/R/S/P/A/T/U/V cluster goal)
3. **K3**: At least medium severity.

## Outcomes

- **All three met** → `Issue`: an entry in the relevant initiative's state-file under `## Findings`.
- **K3 met, K1 or K2 fails** → `in-PR-note`: a bullet in the current PR description.
- **K3 fails** → `wontfix-unless-recurring`: an acknowledgement only.

## Step 1: Gather the finding

Ask the user to paste a free-form description, or read it from the conversation context. Extract:

- File path (if mentioned)
- Severity hint (low / medium / high; default to medium if ambiguous)
- Type hint (bug / quality / test / docs)

If anything critical is missing, ask once consolidated (not in 3 round-trips).

## Step 2: Identify the initiative

Read `docs/superpowers/state/INITIATIVES.md` to get the active initiatives. Suggest the most likely target based on the finding's keywords (e.g., `test`/`mock`/`coverage` → `test-infrastructure-hardening`; `config`/`schema`/`validation` → `open-fix-clusters-latin`). Confirm with the user or accept `none`.

## Step 3: Walk the criteria

Ask the user three short questions:

1. **K1**: "Can you fix this in the current PR?" (yes/no)
2. **K2**: "Does this block v0.20.0, an active feature, or a test-layer cluster goal? If yes, which one?" (free-form, or "no")
3. **K3**: "Severity: low, medium, or high?"

You can pre-fill answers from the description if the user gave clear hints; just confirm rather than re-asking.

## Step 4: Run the evaluator

```bash
pnpm triage-finding evaluate --json '{
  "finding": {
    "description": "<paste here>",
    "severity": "<low|medium|high>",
    "type": "<bug|quality|test|docs>",
    "initiative": "<initiative-name-or-null>"
  },
  "criteria": { "K1": <true|false>, "K2": <true|false>, "K3": <true|false> }
}'
```

The script prints JSON with `recommendation`, `failedCriteria`, and `draft`.

## Step 5: Show the draft and route it

Print the draft to the user with a clear instruction:

- **Issue draft**: "Paste this under `## Findings` in `docs/superpowers/state/<initiative>-status.md`."
- **PR-note draft**: "Add this bullet to the current PR description under an `## Out-of-scope notes` section."
- **wontfix acknowledgement**: "No action needed. The decision is recorded only here in chat."

Do NOT auto-edit state-files or call `gh pr edit`. The draft is for the user to apply.

## When NOT to use this skill

- The finding is a hard blocker that you can fix right now in the same PR. Just fix it.
- The finding is a question, not a defect. Answer it inline.
- The finding is an architecture discussion that needs brainstorming. Invoke the brainstorming skill instead.
