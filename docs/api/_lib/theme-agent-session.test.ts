import { describe, it, expect, vi } from 'vitest';
import {
  handleThemeAgentSession,
  type ThemeAgentSessions,
} from './theme-agent-session';

const ACCESS_KEY = 'correct-horse-battery-staple';

function stubSessions() {
  return {
    start: vi.fn<ThemeAgentSessions['start']>(async (chatId) => ({
      publicAccessToken: `start-token-for-${chatId}`,
    })),
    refreshToken: vi.fn<ThemeAgentSessions['refreshToken']>(
      async (chatId) => `refresh-token-for-${chatId}`
    ),
  };
}

function sessionRequest(body: unknown, cookie?: string): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (cookie !== undefined) headers.set('cookie', cookie);
  return new Request('https://kigumi.style/api/theme-agent', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('Theme Agent access gate', () => {
  it('refuses a request without the access cookie and starts nothing', async () => {
    const sessions = stubSessions();

    const response = await handleThemeAgentSession(
      sessionRequest({ intent: 'start', chatId: 'chat-1' }),
      { accessKey: ACCESS_KEY, sessions }
    );

    expect(response.status).toBe(401);
    expect(sessions.start).not.toHaveBeenCalled();
    expect(sessions.refreshToken).not.toHaveBeenCalled();
  });

  it('refuses a request with the wrong access cookie and starts nothing', async () => {
    const sessions = stubSessions();

    const response = await handleThemeAgentSession(
      sessionRequest(
        { intent: 'start', chatId: 'chat-1' },
        'kigumi-theme-agent=guessed'
      ),
      { accessKey: ACCESS_KEY, sessions }
    );

    expect(response.status).toBe(401);
    expect(sessions.start).not.toHaveBeenCalled();
    expect(sessions.refreshToken).not.toHaveBeenCalled();
  });

  it('refuses every request while no access key is configured', async () => {
    const sessions = stubSessions();

    const response = await handleThemeAgentSession(
      sessionRequest({ intent: 'start', chatId: 'chat-1' }, 'kigumi-theme-agent='),
      { accessKey: undefined, sessions }
    );

    expect(response.status).toBe(401);
    expect(sessions.start).not.toHaveBeenCalled();
  });

  it('starts the chat session and returns its token for the right cookie', async () => {
    const sessions = stubSessions();

    const response = await handleThemeAgentSession(
      sessionRequest(
        { intent: 'start', chatId: 'chat-1' },
        `theme=dark; kigumi-theme-agent=${ACCESS_KEY}`
      ),
      { accessKey: ACCESS_KEY, sessions }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      publicAccessToken: 'start-token-for-chat-1',
    });
    expect(sessions.start).toHaveBeenCalledWith('chat-1');
  });

  it('refreshes the token of an existing session without starting a run', async () => {
    const sessions = stubSessions();

    const response = await handleThemeAgentSession(
      sessionRequest(
        { intent: 'refresh', chatId: 'chat-1' },
        `kigumi-theme-agent=${ACCESS_KEY}`
      ),
      { accessKey: ACCESS_KEY, sessions }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      publicAccessToken: 'refresh-token-for-chat-1',
    });
    expect(sessions.start).not.toHaveBeenCalled();
  });

  it.each([
    ['a body that is not JSON', 'not json'],
    ['an unknown intent', JSON.stringify({ intent: 'delete', chatId: 'chat-1' })],
    ['a missing chat id', JSON.stringify({ intent: 'start' })],
    ['a chat id with a path in it', JSON.stringify({ intent: 'start', chatId: '../runs' })],
  ])('rejects %s with the right cookie and starts nothing', async (_label, body) => {
    const sessions = stubSessions();

    const response = await handleThemeAgentSession(
      new Request('https://kigumi.style/api/theme-agent', {
        method: 'POST',
        headers: { cookie: `kigumi-theme-agent=${ACCESS_KEY}` },
        body,
      }),
      { accessKey: ACCESS_KEY, sessions }
    );

    expect(response.status).toBe(400);
    expect(sessions.start).not.toHaveBeenCalled();
    expect(sessions.refreshToken).not.toHaveBeenCalled();
  });
});
