# Hand-set values are protected by code, not by the prompt

The Theme Agent must never silently overwrite a value the user set by hand
during the conversation. Telling the model so in its prompt would be the
obvious way to get that, and it is not enough: a model can miss a value, and
whether a message like "round the corners more" grants permission to change
a hand-set border radius is a judgement call. So the guarantee lives in Studio,
not in the model. Studio tracks which values are hand-set, sends that list with
every message, and when an answer would change one, applies it only as a
change request the user keeps or overwrites.

## Considered Options

**Prompt instruction** (rejected): no overwriting unless the user mentions the
value. Cheaper, but the guarantee then depends on the model's reading of the
message, and the user cannot rely on it.

**Agent infers hand-set values** (rejected): the model diffs the snapshot it
receives against what it proposed last time. That moves the same judgement into
the model and fails silently when the diff is misread.

## Consequences

Auto mode is the only way to let the Theme Agent change hand-set values
directly, and it is an explicit, per-conversation switch. A change that "simplifies"
change requests away by trusting the prompt is reversing this decision.
