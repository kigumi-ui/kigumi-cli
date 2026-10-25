# The user locks values instead of Studio tracking hand-set ones

ADR 0007 keeps the Theme Agent from silently changing a value the user tuned,
by code rather than the prompt. The first way to tell which values those are
was for Studio to track them: every sidebar edit during a conversation made a
value hand-set, and an answer that would change one raised a change request
to keep or overwrite. Testing it on a preview showed two problems. Studio
cannot tell where a stored value came from: a theme the Theme Agent built
before a reload looks the same as one tuned by hand, so a whole theme came
back as dozens of change requests although the user had changed nothing. And
a rule that only counts edits after the first message let "make it warmer"
turn a brand the user had set just before into orange.

So the user says what is protected: each value in the sidebar has a "Lock
value" switch. A value set per mode is locked in the mode being edited, so a
locked dark surface leaves the light surface free; a mode-independent value
and the shadow component list lock as one. The Theme Agent may change every
value that is not locked. The guarantee of ADR 0007 still lives in code: the
conversation module never applies a proposal for a locked value, it holds it,
and only the user's "Unlock and apply" applies it.

## Considered Options

**Track hand-set values** (rejected, was the first implementation): needs to
know where every value came from, which a reloaded theme does not say, and
needs keep, overwrite, kept values and message naming on top.

**Count everything that differs from the loaded preset as hand-set**
(rejected): catches values set before the first message, but counts the
Theme Agent's own earlier work as hand-set too.

**One lock per value for both modes** (rejected): simpler to show, but
protecting the dark surface would freeze the light one too.

## Consequences

Nothing is locked by default, so a first message can change the whole theme.
Locks are stored on their own, survive a reload, a reset and loading a preset,
are never exported, and are only shown with the Theme Agent's access cookie.
Auto mode from the spec (#181) is no longer needed: with nothing locked, the
Theme Agent already changes everything.

A locked value's control is disabled until it is unlocked: what the user
locked cannot drift by an accidental edit either. #184's "open change
requests do not lock the input" is about requests, not locks: a held change
never disables anything, and the next message can be typed while one is open.

Each held change has its own "Unlock and apply", and two or more add "Unlock
and apply all". Keeping is doing nothing: sending the next message keeps every
change still held, so only the latest answer offers to apply. A value changed
since the answer, after the user unlocked it, is not applied and stays
locked, as Undo leaves a value changed since. Undoing an answer locks again
what its "Unlock and apply" unlocked.

The prompt asks the model to propose a change to a locked value when the
user's message asks for it. Studio holds it, so naming a locked value raises a
held change right away and never a silent one. The reason for a held change
is the answer's own text above it; a held change carries no reason of its own.
