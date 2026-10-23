import { THEME_AGENT_ENDPOINT } from './constants';

/**
 * Ask the Vercel Function for a session-scoped trigger.dev token. `start`
 * creates the chat session (and its run) on first use; `refresh` re-mints the
 * token of an existing session after it expires. The access cookie travels
 * with the request; a refused cookie surfaces as an error in the chat.
 */
export async function requestThemeAgentToken(
  intent: 'start' | 'refresh',
  chatId: string
): Promise<string> {
  const response = await fetch(THEME_AGENT_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ intent, chatId }),
  });
  if (response.status === 401) {
    throw new Error('The Theme Agent access cookie was refused.');
  }
  if (!response.ok) {
    throw new Error(`The Theme Agent could not start (${response.status}).`);
  }
  const { publicAccessToken } = (await response.json()) as {
    publicAccessToken: string;
  };
  return publicAccessToken;
}
