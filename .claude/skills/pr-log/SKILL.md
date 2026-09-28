---
name: pr-log
description: >
  PR body and PR log for this repo: the body is the squash commit on main, and
  one log comment per push carries everything else. Use when opening a pull
  request, after pushing to one, when a PR body has become wrong, or when
  marking a PR ready for review.
---

# PR body and PR log

This repo squashes with `PR_BODY`, so a PR's body **is its commit on main**:
write it as history. Everything that happened on the way there (review
rounds, fixes, evidence, command output) goes in the **log**: one new comment
per push, never edited afterwards. Reviewers, human or agent, read the body
and the log together, and the diff decides where they disagree.
`docs/adr/0006` has the reasoning.

Two guards hold this deterministically, and they are the source of truth for
every rule: `pnpm validate:pr-body` (the `PR body` check) and
`pnpm check:pr-log` (the `pr-log` status). Run them locally before GitHub
does.

## Opening a PR

1. Read the artifacts, not your memory of the session:
   `git diff origin/main...HEAD`, `git log origin/main..HEAD`, and the issue
   (`gh issue view <N> --comments`). Every claim in the body comes from one
   of them.
2. Write the body to a file in the shape of `.github/PULL_REQUEST_TEMPLATE.md`,
   deleting its HTML comments. The summary says what changed and why, as
   something still true after the merge. `## Deviations from #N` only exists
   when the PR deliberately departs from the issue.
3. Run `pnpm validate:pr-body --body-file <file> --draft`. Done when it exits 0.
4. `gh pr create --draft --title "<conventional title>" --body-file <file>`.

## After every push: one round

A **round** is one push session. Each round gets exactly one new log comment.

1. Before pushing, note the remote head: `old=$(git rev-parse origin/<branch>)`.
2. Push. Then compute the range this round covers:
   `from=$(git merge-base "$old" HEAD | cut -c1-7)` and
   `to=$(git rev-parse --short=7 HEAD)`. After a plain push `from` is `old`;
   after a rebase it is the old base, so the range still covers every
   rewritten commit.
3. Number the round: one more than the log comments already on the PR,
   `gh api "repos/{owner}/{repo}/issues/<pr>/comments" --paginate --jq '.[] | select(.body | startswith("**Round ")) | .id' | wc -l`.
4. Write the comment. Its first line is exactly
   `**Round N** · Covers: <from>..<to>`. Below it, only the parts that have
   content:
   - **Changed**: what this round did, and why.
   - **Body edits**: each sentence you changed in the body, and why.
   - **Evidence**: bug-injection tables, gate output, anything a reviewer
     would otherwise have to trust you on. Tables, checklists and
     `<details>` all belong here.
5. `gh pr comment <pr> --body-file <file>`.
6. Run `pnpm check:pr-log --pr <pr>`. Done when it reports no commit outside
   a Covers range (a draft reports `pending`, which is expected).

## When the body has become wrong

Correct only the sentences the round made wrong, with
`gh pr edit <pr> --body-file <file>`, after
`pnpm validate:pr-body --body-file <file> --pr <pr>` exits 0. Name each change under **Body edits** in that round's log
comment. The workflow also posts the old-to-new diff of every body edit
itself, so the record of _what_ changed is kept for you; your comment
supplies _why_. On a PR ready for review, an edit that changes more than half
of the body's lines fails the `PR body` check.

Once a round has evidence, point `## Verification` at it: a link to that log
comment. `CI only` is the whole section when CI is the only evidence.

## Marking a PR ready for review

Readiness switches on the full checks: `## Impact` and `## Verification` are
required, and every claim is matched against the diff (Impact against the
changesets, each `#N`, each backticked repo path, the Verification link). Run
`pnpm validate:pr-body --body-file <file> --pr <pr>` without `--draft`, and
`pnpm check:pr-log --pr <pr>`, and hand the PR over when both pass.

## Bringing an older PR in line

A PR opened before these guards has a long body and no log. While it is a
draft, rewrite the body from the diff and the issue, and move the
evidence and review history out of the old body into one log comment headed
`**Round 1** · Covers: <merge-base with main>..<head>`, which covers every
commit on the branch.
