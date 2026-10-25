# The user locks values instead of Studio tracking hand-set ones

ADR 0007 keeps the Theme Agent from silently changing a value the user tuned, by
code rather than the prompt. The first way to tell which values those are was
for Studio to track them: every sidebar edit during a conversation made a value
hand-set, and an answer that would change one raised a change request to keep
or overwrite. Testing it on a preview showed two problems. Studio cannot tell
where a stored value came from: a theme the Theme Agent built before a reload
looks the same as one tuned by hand, so a whole theme came back as dozens of
change requests although the user had changed nothing. And a rule that only
counts edits after the first message let "make it warmer" turn a brand the user
had set just before into orange.

So the user says what is protected. Each value in the sidebar has a lock, each
section a "Lock all", and one switch above the sections locks everything. The
Theme Agent may change every value that is not locked. The guarantee of ADR
0007 still lives in code: the conversation module never applies a proposal for
a locked value, it holds it, and only the user's "Unlock and apply" applies it.

## Considered Options

**Track hand-set values** (rejected, was the first implementation): needs to
know where every value came from, which a reloaded theme does not say, and
needs keep, overwrite, kept values and message naming on top.

**Count everything that differs from the loaded preset as hand-set**
(rejected): catches values set before the first message, but counts the
Theme Agent's own earlier work as hand-set too.

## Consequences

Nothing is locked by default, so a first message can change the whole theme.
Locks are stored on their own, survive a reload, a reset and loading a preset,
are never exported, and are only shown with the Theme Agent's access cookie.
Auto mode from the spec (#181) is no longer needed: with nothing locked, the
Theme Agent already changes everything.
