import { z } from 'zod';
import type { ChatSessionPersistedState } from '@trigger.dev/sdk/chat';
import type { ThemeAgentMessage } from './message';
import type { ContrastViolation } from './contrast';
import type {
  AnswerOutcome,
  HeldChange,
  HeldEntry,
  SavedAnswer,
  SavedConversation,
} from './conversation';
import { customThemeSchema } from './custom-theme';

// The tab's Theme Agent conversation, kept in sessionStorage so a reload
// brings it back (ADR 0014). Per tab: a second tab has its own conversation.
// What a load cannot read, after a deploy changed the shape for one, starts
// a fresh conversation instead.

const CONVERSATION_KEY = 'kigumi-studio-theme-agent-conversation';
// Apart from the conversation: the transport changes it on its own schedule.
const SESSION_KEY = 'kigumi-studio-theme-agent-session';

/** Everything a reload needs to show and continue the conversation. */
export interface StoredConversation {
  chatId: string;
  messages: ThemeAgentMessage[];
  conversation: SavedConversation;
  /** Answers that hit the output limit. */
  cutOff: string[];
}

const modeValuesSchema = z
  .object({ light: z.string(), dark: z.string() })
  .partial();

const heldChangeSchema: z.ZodType<HeldChange> = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('value'),
    reason: z.enum(['locked', 'edited']),
    cssVar: z.string(),
    proposed: modeValuesSchema,
    was: modeValuesSchema,
  }),
  z.object({
    kind: z.literal('shadowComponents'),
    reason: z.enum(['locked', 'edited']),
    proposed: z.array(z.string()),
    was: z.array(z.string()),
  }),
  z.object({
    kind: z.literal('customCSS'),
    reason: z.enum(['locked', 'edited']),
    proposed: z.string(),
    was: z.string(),
  }),
]);

const violationSchema: z.ZodType<ContrastViolation> = z.object({
  mode: z.enum(['light', 'dark']),
  foreground: z.string(),
  background: z.string(),
  label: z.string(),
  foregroundColor: z.string(),
  backgroundColor: z.string(),
  ratio: z.number().nullable(),
  minimum: z.number(),
  setBy: z.string().optional(),
});

const heldEntrySchema: z.ZodType<HeldEntry> = z.object({
  change: heldChangeSchema,
  state: z.enum(['held', 'applied', 'changed', 'kept']),
  resolves: z.array(violationSchema),
});

const outcomeSchema: z.ZodType<AnswerOutcome> = z.discriminatedUnion(
  'applied',
  [
    z.object({
      applied: z.literal(true),
      theme: customThemeSchema,
      held: z.array(heldChangeSchema),
      violations: z.array(violationSchema),
    }),
    z.object({ applied: z.literal(false), errors: z.array(z.string()) }),
  ]
);

const entriesSchema = z.array(z.tuple([z.string(), z.string()]));

const savedAnswerSchema: z.ZodType<SavedAnswer> = z.object({
  id: z.string(),
  before: customThemeSchema.optional(),
  outcome: outcomeSchema,
  effect: z.object({
    wrote: z.object({ light: entriesSchema, dark: entriesSchema }),
    wroteShadowComponents: z.array(z.string()).optional(),
    wroteCustomCSS: z.string().optional(),
    held: z.array(heldEntrySchema),
  }),
  undone: z.boolean(),
});

const savedConversationSchema: z.ZodType<SavedConversation> = z.object({
  answers: z.array(savedAnswerSchema),
  lastAnswerId: z.string().optional(),
  sentTheme: customThemeSchema.optional(),
});

// The messages' parts are the AI SDK's and the task's; checked only as far
// as rendering them needs. The tab wrote them itself.
const messageSchema = z.looseObject({
  id: z.string(),
  role: z.enum(['system', 'user', 'assistant']),
  parts: z.array(z.looseObject({ type: z.string() })),
});

const storedConversationSchema = z.object({
  chatId: z.string(),
  messages: z.array(messageSchema),
  conversation: savedConversationSchema,
  cutOff: z.array(z.string()),
});

const storedSessionSchema = z.object({
  chatId: z.string(),
  state: z.object({
    publicAccessToken: z.string(),
    lastEventId: z.string().optional(),
    activeInputSeq: z.number().optional(),
    isStreaming: z.boolean().optional(),
    closed: z.boolean().optional(),
    closedReason: z.string().optional(),
  }) satisfies z.ZodType<ChatSessionPersistedState>,
});

/** `JSON.parse`, or `undefined` for text that is not JSON. */
function parseJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Not JSON: nothing this tab can read.
    return undefined;
  }
}

/** The stored text, `null` without one or without storage. */
function readStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    // Storage blocked: the conversation lasts as long as the page.
    return null;
  }
}

/** Store `text` under `key`, or remove it for `null`. */
function writeStorage(key: string, text: string | null): void {
  try {
    if (text === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, text);
  } catch (err) {
    // Blocked or full: a reload then starts a fresh conversation.
    console.warn('Theme Agent conversation not saved:', err);
  }
}

export function saveConversation(stored: StoredConversation): void {
  writeStorage(CONVERSATION_KEY, JSON.stringify(stored));
}

/** The conversation this tab saved, if it can be read. */
export function loadConversation(): StoredConversation | undefined {
  const text = readStorage(CONVERSATION_KEY);
  if (text === null) return undefined;
  const parsed = storedConversationSchema.safeParse(parseJSON(text));
  if (!parsed.success) return undefined;
  return {
    ...parsed.data,
    messages: parsed.data.messages as ThemeAgentMessage[],
  };
}

/** The transport's state for `chatId`; `null` when the transport removed it. */
export function saveSession(
  chatId: string,
  state: ChatSessionPersistedState | null
): void {
  writeStorage(SESSION_KEY, state && JSON.stringify({ chatId, state }));
}

/** The transport's state this tab saved for `chatId`, if it can be read. */
export function loadSession(
  chatId: string
): ChatSessionPersistedState | undefined {
  const text = readStorage(SESSION_KEY);
  if (text === null) return undefined;
  const parsed = storedSessionSchema.safeParse(parseJSON(text));
  if (!parsed.success || parsed.data.chatId !== chatId) return undefined;
  return parsed.data.state;
}

/** The conversation ended: a reload starts a fresh one. */
export function clearConversation(): void {
  writeStorage(CONVERSATION_KEY, null);
  writeStorage(SESSION_KEY, null);
}
