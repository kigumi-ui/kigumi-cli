import { anthropic } from '@ai-sdk/anthropic';
import { chat } from '@trigger.dev/sdk/ai';
import { THEME_AGENT_TASK_ID } from '../src/kigumi-studio/theme-agent/constants.js';

const MODEL = 'claude-sonnet-5-5';

/** Per-answer output ceiling, one of the Theme Agent's cost limits. */
const MAX_OUTPUT_TOKENS = 1024;

const SYSTEM_PROMPT = [
  'You are the Theme Agent in Kigumi Studio, the visual theme builder of Kigumi.',
  'You help the user build a custom Kigumi theme.',
  'Speak of Kigumi and Kigumi themes only; never name the libraries Kigumi is built on.',
  'Answer briefly. Reply in the language the user wrote in.',
].join(' ');

/**
 * The Theme Agent conversation. One durable run per chat: each user message
 * is a turn, and the run suspends right after every turn (no idle compute)
 * until the next message or until `turnTimeout` ends it. See
 * docs/adr/0008-theme-agent-runs-on-chat-agent.md.
 */
export const themeAgent = chat.agent({
  id: THEME_AGENT_TASK_ID,
  // At most one Theme Agent run at a time, whatever the number of chats.
  concurrency: { total: 1 },
  // Compute seconds for the whole run, across turns; suspended time is free.
  maxDuration: 600,
  idleTimeoutInSeconds: 0,
  // An abandoned conversation ends after an hour without messages.
  turnTimeout: '1h',
  run: async ({ messages, signal, streamText }) =>
    streamText({
      model: anthropic(MODEL),
      system: SYSTEM_PROMPT,
      messages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: signal,
    }),
});
