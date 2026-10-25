# Values the user protects are guarded by code, not by the prompt

The Theme Agent must never silently change a value the user wants kept.
Telling the model so in its prompt would be the obvious way to get that, and
it is not enough: a model can miss a value, and whether a message like "round
the corners more" grants permission to change a protected border radius is a
judgement call. So the guarantee lives in Studio, not in the model. Studio
sends the protected values with every message, and when an answer would
change one, holds that change for the user to apply or leave. Which values are
protected is [ADR 0010](0010-the-user-locks-values-instead-of-studio-tracking-hand-set-ones.md):
the ones the user locked.

## Considered Options

**Prompt instruction** (rejected): no changes to protected values unless the
user mentions one. Cheaper, but the guarantee then depends on the model's
reading of the message, and the user cannot rely on it.

**Agent infers protected values** (rejected): the model diffs the snapshot it
receives against what it proposed last time. That moves the same judgement
into the model and fails silently when the diff is misread.

## Consequences

The prompt still lists the protected values, and asks the model to propose a
change to one when the user's message asks for it: that is what makes a held
change appear, not what protects the value. A change that "simplifies" held
changes away by trusting the prompt is reversing this decision.
