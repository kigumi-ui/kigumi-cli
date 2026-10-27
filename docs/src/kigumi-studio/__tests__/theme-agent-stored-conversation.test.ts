// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import type { ThemeAgentMessage } from '../components/theme-agent/ThemeAgentChat';
import {
  clearConversation,
  loadConversation,
  loadSession,
  saveConversation,
  saveSession,
  type StoredConversation,
} from '../theme-agent/stored-conversation';

const theme = {
  light: { '--wa-color-brand': '#0891b2' },
  dark: { '--wa-color-brand': '#0891b2' },
  shadowComponents: ['Card'],
  customCSS: '',
};

const messages: ThemeAgentMessage[] = [
  { id: 'message-1', role: 'user', parts: [{ type: 'text', text: 'Teal' }] },
  {
    id: 'answer-1',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Teal it is.' }],
  },
];

function stored(): StoredConversation {
  return {
    chatId: 'chat-1',
    messages,
    cutOff: [],
    conversation: {
      answers: [
        {
          id: 'answer-1',
          before: { ...theme, light: {}, dark: {} },
          outcome: { applied: true, theme, held: [], violations: [] },
          effect: {
            wrote: {
              light: [['--wa-color-brand', '#0891b2']],
              dark: [['--wa-color-brand', '#0891b2']],
            },
            wroteShadowComponents: ['Card'],
            held: [],
          },
          undone: false,
        },
      ],
      lastAnswerId: 'answer-1',
      sentTheme: theme,
    },
  };
}

beforeEach(() => sessionStorage.clear());

describe('Stored Theme Agent conversation', () => {
  it('loads the conversation the tab saved', () => {
    saveConversation(stored());

    expect(loadConversation()).toEqual(stored());
  });

  it.each([
    ['text that is not JSON', '{"chatId":'],
    ['a shape an older Studio saved', JSON.stringify({ chatId: 'chat-1' })],
    [
      'an answer whose written values are not entries',
      JSON.stringify({
        ...stored(),
        conversation: {
          answers: [
            {
              ...stored().conversation.answers[0],
              effect: { wrote: { light: {}, dark: {} }, held: [] },
            },
          ],
        },
      }),
    ],
    [
      'a message without parts',
      JSON.stringify({ ...stored(), messages: [{ id: 'm', role: 'user' }] }),
    ],
  ])('starts a fresh conversation from %s', (_case, text) => {
    sessionStorage.setItem('kigumi-studio-theme-agent-conversation', text);

    expect(loadConversation()).toBeUndefined();
  });
});

describe('Stored Theme Agent session', () => {
  const session = {
    publicAccessToken: 'token-1',
    lastEventId: '41',
    activeInputSeq: 3,
    isStreaming: true,
  };

  it("loads the transport's state for the chat it was saved for, and no other", () => {
    saveSession('chat-1', session);

    expect(loadSession('chat-1')).toEqual(session);
    expect(loadSession('chat-2')).toBeUndefined();
  });

  it('forgets the state the transport removed', () => {
    saveSession('chat-1', session);
    saveSession('chat-1', null);

    expect(loadSession('chat-1')).toBeUndefined();
  });

  it('forgets the conversation and its session when the conversation ends', () => {
    saveConversation(stored());
    saveSession('chat-1', session);

    clearConversation();

    expect(loadConversation()).toBeUndefined();
    expect(loadSession('chat-1')).toBeUndefined();
  });
});
