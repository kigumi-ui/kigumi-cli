# The brand fill is a user value with a derived default

Studio derives the brand fill (`--wa-color-brand-fill-loud`, the fill of
brand buttons and badges under white text) from the brand colour, at palette
step 40 in both modes. Until now that was the only way to set it, so the
only fix for a failing brand fill pair was another brand, and the brand is
the user's: the Theme Agent reported the pair and never corrected it unless
the user asked.

The brand fill is now a Studio value of its own, set per mode. Unset (`''`,
its default) it follows the brand as before; set, it is the user's colour in
that mode, and Studio paints, exports and checks it. The `follows` field of
a property definition is the shape for such a derived default. Since the
fill fixes the brand fill pair without touching the brand, that pair is
corrected like every other pair: the Theme Agent may change the fill, set or
unset, in its first answer or a correction round, without the user asking,
and the change is applied and listed in the answer. It never fixes the pair
by changing the brand unless the user's message asks to change the brand.

This amends the rule that the brand fill pair is never corrected unasked. It
keeps ADR 0007 and ADR 0010: a lock is how the user keeps a value unchanged,
so a locked fill is what the accessibility warning names for the pair, and
the Theme Agent's fix for it is held, never applied.

## Considered Options

**Keep the pair reported only** (rejected): it made sense while the brand
was the only value behind the fill. With a value of its own, refusing to fix
the fill would leave the user to fix by hand what any other pair gets fixed
for them, and a lock already says "leave this alone".

**Correct only a fill the user set** (rejected): an unset fill is a value
like a surface left at its default, which the Theme Agent changes freely. A
rule that turns on whether the user touched the value first is the kind of
tracking ADR 0010 replaced with locks.

**Clamp the fill to a passing colour** (rejected): Studio would change the
user's colour without saying so. A failing fill is reported, and only an
answer, which lists what it changed, or the user changes it.

## Consequences

An answer that sets the fill stops it following the brand in that mode; the
prompt asks the model to leave it empty unless the pair fails or the user
asks for a fill, and an answer may set it to `''` to make it follow again.
A pasted or imported declaration of the fill is a set value, also when it
is the colour the brand derives. Studio stores the user's own values for a
reload (state version 2.1), not the export, which writes the derived fill
with every changed brand; a state stored as the export (2.0) still loads,
with a fill equal to its brand's derivation read as unset.
