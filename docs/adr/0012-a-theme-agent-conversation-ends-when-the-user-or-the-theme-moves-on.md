# A Theme Agent conversation ends when the user or the theme moves on

A conversation's held changes and Undo only mean something for the theme
they were made on. So a conversation ends with "New chat" and whenever the
whole custom theme is replaced: a preset, Default, an import. Ending it stops
a running answer, discards what its run still sends (the conversation
module's `end()`), and closes its trigger.dev session from the browser
through the `close` intent of `POST /api/theme-agent`. Leaving the page
(`pagehide`) closes the session as well. A reload starts a fresh conversation
because the chat id is per page load; the custom theme is Studio's own and
persists.

What ends with a conversation is the conversation's own state: its chat
history, held changes, Undo, the run and its session. The spec (#181) and
#187 also list hand-set values, kept values and auto mode. ADR 0010 replaced
all three with locks, which are the user's own and survive a reset and a
preset load, so ending a conversation leaves them. The draft in the message
field survives too: it is what the user is about to say, not part of the
conversation that ended.

## Considered Options

**Rely on `turnTimeout` alone** (rejected): #187 expected an abandoned
conversation to end after a fixed time without messages. That holds as a
fallback, but on its own every "New chat" or preset load would leave a run
waiting for an hour and the session listed as active in trigger.dev. The
browser knows the moment a conversation ends, so it says so.

**Close the session from the task** (rejected): the task cannot tell "New
chat" from a user who is still thinking. Only the browser sees the button and
the preset.

**Reset locks with the conversation** (rejected): ADR 0010 makes locks the
user's own, and a preset load that unlocked every value would undo a
decision the user made deliberately.

## Consequences

The close is sent, not awaited: the record that makes the waiting run exit,
then the session close, in that order because a closed session refuses
appends. When the request never arrives (a crashed tab, a page kept in the
back/forward cache), the run ends after it has waited `turnTimeout` (1h) for
a message, as ADR 0008 describes; that value stays. A conversation that never
sent a message has no session and nothing to end.

Whether the run and the session end as described is checked against
trigger.dev on a preview deployment, not by the unit tests, which stub the
trigger.dev calls.

Superseded in part by ADR 0014. Leaving the page no longer closes the
session, and a reload restores the conversation instead of starting a fresh
one: each tab keeps it in `sessionStorage`. "New chat" and a replaced custom
theme still end the conversation and close its session as described here.
