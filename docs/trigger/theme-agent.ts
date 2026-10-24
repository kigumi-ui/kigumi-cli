import { anthropic } from '@ai-sdk/anthropic';
import { chat } from '@trigger.dev/sdk/ai';
import {
  THEME_AGENT_STATUS,
  THEME_AGENT_TASK_ID,
} from '../src/kigumi-studio/theme-agent/constants.js';
import { themeAgentClientDataSchema } from '../src/kigumi-studio/theme-agent/custom-theme.js';
import { themeAgentTurn } from './theme-agent-turn.js';

const MODEL = 'claude-sonnet-5-5';

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
  // Every message carries the custom theme as it is in the browser.
  clientDataSchema: themeAgentClientDataSchema,
  run: async ({ messages, clientData, signal, streamText }) => {
    if (!clientData) {
      throw new Error('A Theme Agent message arrived without its snapshot.');
    }
    chat.response.write({
      type: 'data-status',
      data: { step: THEME_AGENT_STATUS.drafting },
      transient: true,
    });
    return themeAgentTurn({
      streamText,
      model: anthropic(MODEL),
      messages,
      snapshot: clientData,
      abortSignal: signal,
    });
  },
});
