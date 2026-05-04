---
name: weekly-review
description: >
  Surface initiatives whose state-file has not been touched in 14 days
  and walk the user through them one at a time, asking "still
  accurate?" before moving on. Use when the user says "weekly review",
  "what's stale", "review state-files", or after the stop-hook surfaces
  a freshness reminder.
user-invocable: true
allowed-tools: Read, Bash, Edit
---

# Weekly State-File Review

List initiatives whose `docs/superpowers/state/<x>-status.md` has been silent for more than 14 days and prompt the user to refresh each. The skill does not edit state-files; it surfaces and asks.

## Step 1: Run the staleness query

```bash
pnpm state-staleness list
```

Output is JSON sorted by `daysStale` descending. Each row has: `initiative`, `stateFile`, `lastModified`, `daysStale`, `status`.

If the JSON array is empty, all state-files are within the 14-day window. Tell the user "All initiatives are fresh." and stop.

## Step 2: Walk the rows

For each stale row, show the user:

```
Initiative: <name>
State-file: docs/superpowers/state/<file>
Last touched: <date> (<N> days ago)
Current Status column: <status>
```

Ask: "Still accurate? Want to open the state-file?"

- If yes → use `Read` to show the state-file's first 30 lines, ask the user what should change. The user makes the edits via `Edit` (the skill helps but does not commit unilaterally).
- If skip → continue to the next row.

## Step 3: Optional touch-up

After walking all rows, ask if the user wants to refresh `INITIATIVES.md`'s "Last updated" date. If yes, use the `Edit` tool to replace the line `**Last updated:** <old-date>` with today's date (`date +%Y-%m-%d` in shell, or read the current ISO date from session context). Use `Edit`, not `sed`, to keep the operation portable across macOS/Linux and to keep changes traceable through Claude Code's edit history.

Then prompt the user to commit the result.

## When NOT to use this skill

- The user has made multiple commits to state-files in the current session. They are already on top of it.
- The user is in the middle of a different task and the freshness reminder fired in passing. Defer.
