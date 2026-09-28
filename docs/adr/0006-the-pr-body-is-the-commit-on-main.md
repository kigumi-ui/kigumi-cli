# The PR body is the commit on main; the log carries the evidence

The repo squashes with `squash_merge_commit_message: PR_BODY`, so every PR
body becomes a commit message on main. Bodies had grown to 5-8k characters of
session log: every command run, bug-injection tables, a new section per
review round. `9126edb9` (#126) carries a 160-line message, `5d1d0dfa` (#118)
278 lines, and #131's table is wrapped mid-cell in `2cc1874f`. Agents create
PRs with `gh pr create --body`, which bypasses the PR template, so the
template shaped nothing.

We decided that the body is written as history and everything else goes in a
log (issue #150):

- **The body** describes the change: a summary, then only `## Deviations from
#N`, `## Impact`, `## Review focus` and `## Verification`. It is written
  once, from the diff and the issue rather than from session memory, and
  afterwards only corrected where it became wrong.
- **The log** is one new PR comment per push, headed
  `**Round N** · Covers: a..b`, never edited afterwards. Review rounds, fixes
  and evidence live there, including tables, checklists and `<details>`,
  which break or turn into noise in `git log`.

Reviewers read both, and the diff decides a contradiction. This is the
procedure human review already had: a description, then a conversation.

## Considered Options

**Rewrite the body on every push** (rejected): it keeps the body current, but
a model that gets one sentence wrong replaces a correct text silently.
GitHub keeps body revisions, but nobody reviews them. An append-only log
keeps the trail.

**Evidence in `<details>` in the body** (rejected): the squash writes it to
main as raw HTML.

**Squash with `BLANK` or `COMMIT_MESSAGES`** (rejected): `BLANK` loses the
description from history; `COMMIT_MESSAGES` puts every "fix review finding"
commit on main. Keeping `PR_BODY` makes "still true as history" the filter
against bloat.

## Enforcement

Rules the agents are told drift when a memory or a habit says otherwise, so
two guards hold them:

- `pr-body.yml` (`validate:pr-body`) checks structure and size on every PR,
  and on a PR ready for review, claims matched against artifacts: Impact
  against the changesets in the diff, each `#N`, each backticked repo path (a
  token whose first segment is a top-level entry; a bare name could be any
  nested file, so it is not checked; `docs/adr/NNNN` counts when exactly one
  ADR has that number, as AGENTS.md cites them), and a Verification that
  reads `CI only` or links a log comment on this PR.
  It runs on `edited`, which `ci.yml` does not, so it also carries the PR-body
  half of the attribution check (#97), which never saw a body edited after
  the last push. On every body edit it posts the old-to-new diff itself, from
  the old body GitHub puts in the event, and fails an edit that changes more
  than half of a ready PR's body.
- `pr-log.yml` (`check:pr-log`) requires every commit committed after the PR
  opened to sit in some log comment's `Covers:` range. Committer time stands
  in for push time, which GitHub does not expose per commit: a commit made
  before the PR opened but pushed later needs no round, and a rebase renews
  the time, so rewritten commits need one. It runs on
  `issue_comment` too, since posting the comment is what fixes it, and a
  comment-triggered job is attached to main rather than the PR, so it reports
  the `pr-log` commit status instead of a job result.

Bots and the changesets release PR are exempt: their bodies are generated.
The body job skips them through its `if:`, and a skipped job satisfies a
required check. A commit status has no skipped state, so `pr-log` passes an
exempt PR with the description `Not checked: exempt (...)` and keeps a draft
`pending`. That is ADR 0003 applied within what the status API allows: the
outcome never claims a check ran.

## Consequences

The prose of the body stays unverifiable by a script. `/code-review`'s Spec
axis covers it: it reads the body and the log against the diff and reports
body claims the diff does not back and user-facing changes the body omits.

A fork's PR gets no edit trail (its token cannot comment) and gets its
`pr-log` status only from comment runs. The repo's PRs come from its own
branches, so this is accepted rather than worked around with
`pull_request_target`.
