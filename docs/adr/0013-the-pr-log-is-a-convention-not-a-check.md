# The PR log is a convention, not a check

ADR 0006 split a PR into a body (the commit on main) and a log (one comment
per push), and enforced both. The `pr-log` commit status required every
commit pushed after the PR opened to sit in a log comment's `Covers:`
range. We removed that check and kept the log as a convention: the pr-log
skill still posts one round per push, and `## Verification` in the body
names the rounds that hold the evidence, which the `PR body` check holds to
exist once the PR is ready.

The status's record from #151 to #217 decided it. Of its 14 failures, 10
lasted under two minutes: the time between a push and the log comment that
names the pushed commits, which can only follow the push. One was a merge
of main that brought nothing of the PR's own. At most three, lasting 6 to
18 minutes, may have been a round that was actually forgotten, and none of
them shows that the round would not have come anyway. Against that stood a
workflow, a required status and the machinery #217 added to stop the
false alarms (a pending state, merge detection, a re-read against
cancelled runs). The body check earned its place. Before #151, 24 of 130
squash commits on main were over 2,500 characters, up to 13,068. Of the 32
since, the ones over are three Dependabot updates (exempt), two merged the
day the check landed (2,897 and 3,419), and five 28 to 160 characters over,
which is the title the squash adds to a body within the limit.

## Considered Options

**Keep the check, with #217's fixes** (rejected): it would no longer go red
after every push, but it would still guard something the body check already
guarantees where it matters. A ready PR's Verification must name a round
that exists, so the evidence log is there when a reviewer reads it; what
the coverage check added on top was one comment per push, which is the
ceremony, not the evidence.

**Make it advisory** (rejected): a check that never blocks and is read by
nobody is a workflow to maintain for no decision.

## Consequences

Nothing stops a push without a round. A reviewer who misses one asks for
it, as with any missing explanation. The `Covers:` header stays in the
skill, so a round still says which commits it is about, and the `PR body`
check reads round numbers from it. Only comments by `OWNER`, `MEMBER` or
`COLLABORATOR` count as rounds.
