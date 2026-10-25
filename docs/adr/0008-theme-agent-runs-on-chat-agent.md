# The Theme Agent runs on trigger.dev's chat.agent

The Theme Agent conversation runs as one trigger.dev `chat.agent` run per
chat, driven from the Vite SPA by `useChat` with `useTriggerChatTransport`.
The spec (#181) kept a fallback open, one `schemaTask` run per message with
the browser sending the transcript, in case the chat transport needed
Next.js server actions. It does not: the transport's `startSession` and
`accessToken` options are plain async callbacks. In Studio they call one
Vercel Function (`docs/api/theme-agent.ts`), which runs
`chat.createStartSessionAction` and `auth.createPublicToken` server-side
after the access cookie check. Messages and the streamed reply then go
between the browser and trigger.dev directly.

Evidence, from the tracer bullet (#182) on a Vercel preview: a message
streamed back a reply from Claude Sonnet through the deployed task. After a
reload, a new conversation was answered while the first one was abandoned,
so a chat run suspended between turns (idle timeout 0) does not hold the
task's single concurrency slot.

## Considered Options

**One run per message** (fallback, not needed): simpler run lifecycle, but
the browser resends the whole transcript every turn and the conversation
has no home on the server.

**No trigger.dev, a Vercel Function streaming from Anthropic** (rejected):
enough for plain chat, and simpler to set up. The Theme Agent's answers are
an agent loop (validate the proposal, check contrast, correct up to twice,
#183 and #185) that can outlast a function invocation; trigger.dev also
enforces `concurrency: { total: 1 }` without a store of our own, and shows
every turn in its run traces.

## Consequences

An abandoned conversation ends when its run has waited `turnTimeout` (1h)
for a message; suspended time is not billed. This comes from the SDK's
option docs. Since ADR 0012 the browser closes a conversation it ends, so the
timeout is the fallback for one it could not close, and stays at 1h. `maxDuration` counts compute seconds
across all turns of one run.

The task deploys by hand, and Vercel Production and Preview both use the
trigger.dev Production key: a preview or dev key makes the SDK send the
Vercel branch as a trigger.dev branch that does not exist.
