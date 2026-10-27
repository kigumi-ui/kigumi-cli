# A Theme Agent conversation survives a reload

The custom theme and its locks survive a reload, so a conversation about that
theme should too. Each tab keeps its conversation in `sessionStorage`: the
chat id, the transport's session state, the chat messages and the
conversation module's state (answers with their `before` theme, held changes,
Undo, and `sentTheme`, the theme the last message carried). After a reload the
tab restores all of it, reattaches to its trigger.dev session, and resumes an
answer that was still being written, which is then applied or held exactly as
it would have been without the reload. Leaving the page no longer closes the
session. A conversation still ends only with "New chat" or a replaced custom
theme (ADR 0012), and those still close the session.

What comes back is the conversation as `GLOSSARY.md` defines it: messages,
answer status, held changes, Undo, contrast violations and the cut-off mark.
Transient UI (the status line of a running answer, a notice, focus) does not.

## Considered Options

**Restore the history from trigger.dev's transcript snapshot** (rejected):
reading it needs the secret key, so a new intent on `POST /api/theme-agent`,
and the snapshot holds only messages. Undo, held changes and `sentTheme` exist
only in the browser, so a restored conversation would show answers it can no
longer undo or apply. The snapshot stays what the agent reads its own context
from.

**One conversation per browser in `localStorage`** (rejected): the theme is
per browser, but two Studio tabs would then write into one conversation at
once, and held changes and Undo would have to reconcile across tabs. Per tab,
two tabs have two conversations on one theme, as before.

**Detect a theme another tab replaced** (rejected): if tab B loads a preset
and tab A reloads, A restores its conversation on B's theme, although ADR
0012 would have ended it. A fingerprint of the theme saved with the
conversation could catch this, but the theme is saved debounced and the
conversation at once, so it would also end conversations nobody replaced.
Undo already leaves every value changed since as it is.

**Detect a duplicated tab** (rejected): duplicating a tab copies its
`sessionStorage`, so both tabs share the conversation. Telling them apart
needs a `BroadcastChannel` handshake for a deliberate user action whose worst
case is two diverging Undo stacks over value-wise safe Undo; the run handles
their messages one at a time.

## Consequences

A closed tab leaves its session open in trigger.dev, with no run and no cost:
the run that waited for a message ends after `turnTimeout` (1h), and the chat
id is gone with the tab's `sessionStorage`. A message after `turnTimeout` in a
tab that is still open starts a new run on the same session, which loads the
snapshot; the transport re-mints an expired token through the `refresh`
intent. `turnTimeout` only bounds how long a suspended run waits, not how long
a conversation lives.

Whether reattaching, resuming a running answer and a run started after
`turnTimeout` behave as described is checked against trigger.dev on a preview
deployment, not by the unit tests, which stub the trigger.dev calls.
