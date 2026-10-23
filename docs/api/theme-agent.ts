// Vercel Function: POST /api/theme-agent. The cookie check and request
// handling live in _lib/theme-agent-session.ts; this file only wires the
// environment and the trigger.dev SDK into it. TRIGGER_SECRET_KEY is read by
// the SDK from the environment and never leaves this function.
import { auth } from '@trigger.dev/sdk';
import { chat } from '@trigger.dev/sdk/ai';
import { THEME_AGENT_TASK_ID } from '../src/kigumi-studio/theme-agent/constants.js';
import { handleThemeAgentSession } from './_lib/theme-agent-session.js';

const startChatSession = chat.createStartSessionAction(THEME_AGENT_TASK_ID);

export function POST(request: Request): Promise<Response> {
  return handleThemeAgentSession(request, {
    accessKey: process.env.THEME_AGENT_ACCESS_KEY,
    sessions: {
      start: (chatId) => startChatSession({ chatId }),
      refreshToken: (chatId) =>
        auth.createPublicToken({
          scopes: { read: { sessions: chatId }, write: { sessions: chatId } },
          expirationTime: '1h',
        }),
    },
  });
}
