# The PR body is for the reviewer; main gets the title

ADR 0006 made the PR body the squash commit on main and enforced it as
history: four headings, 2,500 characters, claims matched against the diff,
an edit trail, and a log of one comment per push. It solved a real problem,
5-8k character session logs landing in `git log`. It also cost a required
check, four scripts and their tests (about 2,500 lines), and a body written
for `git log` instead of for the one person who reviews every PR. That
reviewer did not read the log comments or the edit trail.

The squash commit now takes the PR title and no message
(`squash_merge_commit_message: BLANK`), so nothing in the body reaches main.
The body is written for review: what changed, the evidence, and how risky
the merge is (`.github/PULL_REQUEST_TEMPLATE.md`). The `PR body` check, its
edit trail and the `pr-log` skill are gone, and the log is no longer a
convention. Squash is the only merge method the repository allows, so review
fix commits never reach main either.

## Considered Options

**Keep the body as the commit and drop only the log** (rejected): the body
would still need a guard to stay short, and a review-oriented body
(diagrams, before and after) is noise in `git log`.

**Commit messages of the branch as the squash message** (rejected): they
include every review-fix commit, which is what squash exists to hide.

## Consequences

`git log` on main reads as titles with `(#N)`; the why lives in the PR, one
`gh pr view N` away. User-facing changes are described in the changesets,
which build `CHANGELOG.md`. The `attribution` job in `ci.yml` keeps checking
every branch commit.

Supersedes ADR 0006 and ADR 0013.
