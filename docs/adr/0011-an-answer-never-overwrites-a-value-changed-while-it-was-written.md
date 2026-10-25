# An answer never overwrites a value changed while it was written

ADR 0010 lets the Theme Agent change every value the user did not lock. That
leaves one case open: the user tunes a value in the sidebar while an answer is
being written, and the answer, written for the value as the message carried
it, arrives with another one. Applying it would undo the user's latest edit
without asking, which the spec (#181, stories 32 and 42) rules out.

So an answer holds every value that differs, when it arrives, from the theme
its message carried, locked or not. The conversation module compares the
two; the user applies such a change with "Apply", which unlocks nothing,
because nothing was locked. The next message's snapshot tells the agent which
of its values it did not change for that reason.

## Considered Options

**Overwrite and rely on Undo** (rejected): Undo reverts the whole answer, so
keeping the user's edit would cost the rest of it.

**Lock the edited value** (rejected): Studio would flip a lock the user never
set, and ADR 0010 makes locks the user's own.

**Hold every value touched during the run** (rejected): a value changed and
set back to what the message carried is the value the answer was written
for, so holding it would ask about nothing. Studio compares states, not edit
history.

## Consequences

"Changed while the answer was written" means "differs from the message's
theme when the answer arrives". Undoing an earlier answer while a run is in
progress counts too: it is the user's change. Like a locked value, a held
edit is offered only under the latest answer, and the next message keeps the
user's value.
