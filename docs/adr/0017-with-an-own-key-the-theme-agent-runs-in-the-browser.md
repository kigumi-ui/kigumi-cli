# With an own key, the Theme Agent runs in the browser

A visitor without the access cookie can use the Theme Agent with an own key:
an Anthropic API key entered in the Theme Agent's settings. With an own key,
the browser runs the answer itself. A third `ThemeAgentTransport` calls
`themeAgentTurn()` with `createAnthropic({ apiKey })`, and the request goes
from the browser to `api.anthropic.com` and nowhere else. The answer loop
(validate the proposal, check contrast, correct) is the same code as on the
trigger.dev task, with the same model, thinking and effort. The trigger.dev
path stays as ADR 0008 describes it, behind the access cookie and paid by
Kigumi. When both are present, the own key wins: entering it is the more
deliberate choice.

The point is a promise users can check. Studio says the key reaches no one
but Anthropic, and the browser's network tab shows exactly that; the source
on GitHub shows how. A key that passes through a trigger.dev run would sit in
its payload, visible to trigger.dev and to whoever owns the account, and no
link to the repository proves what is deployed.

ADR 0008 rejected a Vercel Function because an answer can outlast a function
invocation. A browser tab has no such limit, so that reason does not apply
here.

## Considered Options

**The own key travels to the trigger.dev task** (rejected): one code path
and run traces for every conversation, but the key would be visible to
trigger.dev and to Kigumi, and the promise could not be kept or checked.

**A free tier on Kigumi's key for everyone** (not now): the trigger.dev path
opened to visitors without the cookie, behind a rate limit per IP and a daily
cap. It would put every visitor's usage on Kigumi's trigger.dev and Anthropic
bills. Until it exists, the trigger.dev path needs no rate limit beyond the
cookie, `concurrency: { total: 1 }` and an organization spend limit.

**A model picker** (not now): the prompt eval covers only
`THEME_AGENT_MODEL`, so answers from another model would be unchecked.

## Consequences

The key lives in the tab's `sessionStorage`, like the conversation (ADR
0014), or in `localStorage` when the user ticks "Remember on this device".
Either way any script on the page could read it; the settings dialog says
so and recommends a key with a spend limit. The dialog checks only the key's
form: Anthropic answers a CORS request with an invalid key with a 401 that
carries no CORS headers, so the browser cannot tell a wrong key from a
network failure, and a test call would say no more than the first message.

`@ai-sdk/anthropic` does not send the `anthropic-dangerous-direct-browser-access`
header Anthropic requires for browser requests; the transport passes it.
The browser path, the Anthropic provider and the answer loop with its
system prompt load as their own chunk, only once an own key is saved. The
part of the `ai` package the loop calls loads with the panel: the panel's
`useChat` loads that module already, and a bundler keeps a module in one
chunk. The prompt is public in the repository already.

Kigumi sees nothing of a conversation on an own key: no run traces, no
telemetry. Saving or removing an own key changes where the Theme Agent runs,
and the agent's context does not carry across (the session snapshot on one
side, the browser's messages on the other), so it ends the conversation as
"New chat" does (ADR 0012); replacing one key with another does not. A
reload during an answer on the browser path cannot resume it, since nothing
outside the tab was writing it: the restored conversation (ADR 0014) marks
that answer cut off, and no part of its proposal is applied.
