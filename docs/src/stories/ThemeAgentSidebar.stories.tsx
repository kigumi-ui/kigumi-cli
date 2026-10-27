import type { Meta, StoryObj } from '@storybook/react-vite';
import type { UIMessageChunk } from 'ai';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ThemeAgentSidebar } from '@/kigumi-studio/components/theme-agent/ThemeAgentSidebar';
import type { ThemeAgentTransport } from '@/kigumi-studio/components/theme-agent/ThemeAgentChat';
import { StudioProvider } from '@/kigumi-studio/contexts/StudioContext';
import { CUSTOM_CSS_LOCK, type LockedValues } from '@/kigumi-studio/lib/locks';
import { DEFAULT_VALUES } from '@/kigumi-studio/lib/defaults';
import { THEME_AGENT_PROPOSE_TOOL } from '@/kigumi-studio/theme-agent/constants';
import { createThemeAgentConversation } from '@/kigumi-studio/theme-agent/conversation';
import type { CustomTheme } from '@/kigumi-studio/theme-agent/custom-theme';
import {
  clearConversation,
  loadConversation,
  saveConversation,
} from '@/kigumi-studio/theme-agent/stored-conversation';
import type {
  ProposeThemeOutput,
  ThemeProposalInput,
} from '@/kigumi-studio/theme-agent/proposal';

// The Theme Agent sidebar in a real browser, where Web Awesome runs: its
// answer layout and actions, against a canned conversation. No network, no
// model: the transport streams what the trigger.dev task would, an answer's
// text and its accepted `propose_theme` call, and Studio's own conversation
// module decides what is applied and what is held.

/** One canned answer: its text and proposal, or one that never finishes. */
type CannedAnswer =
  | { text: string; proposal: ThemeProposalInput }
  | { running: true }
  | { streaming: string }
  | { thinkingOnly: true };

interface CannedTransport extends ThemeAgentTransport {
  /** How many messages the conversation on screen sent to its run. */
  readonly sent: number;
}

/** The chunks the task streams for an answer the task accepted. */
function answerChunks(
  id: string,
  text: string,
  proposal: ThemeProposalInput
): UIMessageChunk[] {
  const output: ProposeThemeOutput = {
    accepted: true,
    errors: [],
    contrast: [],
    correctContrast: false,
    lockedContrast: [],
    locked: [],
  };
  return [
    { type: 'start', messageId: id },
    { type: 'start-step' },
    { type: 'text-start', id: `${id}-text` },
    { type: 'text-delta', id: `${id}-text`, delta: text },
    { type: 'text-end', id: `${id}-text` },
    {
      type: 'tool-input-available',
      toolCallId: `${id}-proposal`,
      toolName: THEME_AGENT_PROPOSE_TOOL,
      input: proposal,
    },
    {
      type: 'tool-output-available',
      toolCallId: `${id}-proposal`,
      output,
    },
    { type: 'finish-step' },
    { type: 'finish', finishReason: 'stop' },
  ];
}

/**
 * A transport that answers a conversation's n-th message with the n-th
 * canned answer. A new chat id, a remount or a retried story, starts again.
 */
function cannedTransport(answers: CannedAnswer[]): CannedTransport {
  let chat: string | undefined;
  let sent = 0;
  return {
    get sent() {
      return sent;
    },
    getSession: () => undefined,
    reconnectToStream: async () => null,
    sendMessages: async ({ chatId, abortSignal }) => {
      if (chatId !== chat) {
        chat = chatId;
        sent = 0;
      }
      const answer = answers[sent];
      sent += 1;
      if (!answer) throw new Error(`No canned answer for message ${sent}`);
      return new ReadableStream<UIMessageChunk>({
        start(controller) {
          if ('thinkingOnly' in answer) {
            // The model spent its whole output limit thinking: no text, no
            // proposal, a finish for the length limit (captured on a preview).
            const id = `answer-${sent}`;
            for (const chunk of [
              { type: 'start', messageId: id },
              { type: 'start-step' },
              { type: 'reasoning-start', id: `${id}-reasoning` },
              { type: 'reasoning-end', id: `${id}-reasoning` },
              { type: 'finish-step' },
              { type: 'finish', finishReason: 'length' },
            ] satisfies UIMessageChunk[]) {
              controller.enqueue(chunk);
            }
            controller.close();
            return;
          }
          if ('streaming' in answer) {
            const id = `answer-${sent}`;
            for (const chunk of [
              { type: 'start', messageId: id },
              { type: 'start-step' },
              { type: 'text-start', id: `${id}-text` },
              { type: 'text-delta', id: `${id}-text`, delta: answer.streaming },
            ] satisfies UIMessageChunk[]) {
              controller.enqueue(chunk);
            }
            abortSignal?.addEventListener('abort', () => controller.close(), {
              once: true,
            });
            return;
          }
          if ('running' in answer) {
            // Started, never finished: the answer runs until it is stopped.
            controller.enqueue({ type: 'start', messageId: `answer-${sent}` });
            abortSignal?.addEventListener('abort', () => controller.close(), {
              once: true,
            });
            return;
          }
          for (const chunk of answerChunks(
            `answer-${sent}`,
            answer.text,
            answer.proposal
          )) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });
    },
  };
}

const LOCKS_KEY = 'kigumi-studio-locks';
const STATE_KEY = 'kigumi-studio-state';

/**
 * Start from Studio's defaults with `cssVars` locked in both modes, as the
 * "Lock value" switches store them; the page's storage is put back after.
 */
function withLockedValues(...cssVars: string[]) {
  return withStoredLocks({
    light: cssVars,
    dark: cssVars,
    shadowComponents: false,
    customCSS: false,
  });
}

/**
 * Start from Studio's defaults with `locks` stored, as the switches store
 * them, and no conversation saved in the tab.
 */
function withStoredLocks(locks: LockedValues) {
  return () => {
    const saved = [LOCKS_KEY, STATE_KEY].map(
      (key) => [key, localStorage.getItem(key)] as const
    );
    localStorage.removeItem(STATE_KEY);
    localStorage.setItem(LOCKS_KEY, JSON.stringify(locks));
    clearConversation();
    return () => {
      clearConversation();
      for (const [key, value] of saved) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
    };
  };
}

/** The message field's own textarea, inside wa-textarea's shadow root. */
function messageField(canvasElement: HTMLElement): HTMLTextAreaElement {
  const textarea = canvasElement
    .querySelector('.theme-agent__composer wa-textarea')
    ?.shadowRoot?.querySelector('textarea');
  if (!textarea) throw new Error('message field not found');
  return textarea;
}

/** Type a message and send it with Enter, as the user does. */
async function send(canvasElement: HTMLElement, text: string) {
  const field = messageField(canvasElement);
  await waitFor(() => expect(field.isConnected).toBe(true));
  field.focus();
  await userEvent.keyboard(`${text}{Enter}`);
}

/** True when `node` comes after `card` in the page and outside it. */
function belowCard(card: Element, node: Element): boolean {
  return (
    !card.contains(node) &&
    (card.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) !==
      0
  );
}

const meta = {
  title: 'Studio/Theme Agent Sidebar',
  component: ThemeAgentSidebar,
  // Maintainer-only: listed in the local Storybook, tested in the
  // interaction lane, not listed in the published Storybook (.storybook/main.ts).
  tags: ['maintainer', '!autodocs', 'interaction'],
  parameters: { layout: 'fullscreen' },
  args: { open: true },
  decorators: [
    (Story) => (
      <StudioProvider>
        <Story />
      </StudioProvider>
    ),
  ],
} satisfies Meta<typeof ThemeAgentSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const WARMER =
  'A warmer theme: a terracotta brand on cream surfaces, with rounder corners.';

const warmerProposal: ThemeProposalInput = {
  light: {
    '--wa-color-brand': '#c2410c',
    '--wa-color-surface-default': '#fdf6ec',
    '--wa-border-radius-scale': '1.5',
  },
  dark: { '--wa-color-surface-default': '#241a12' },
};

/**
 * One locked value: its "Unlock and apply" sits in the answer's card, and
 * Studio's report below it. Unlocking turns the neutral callout into the
 * success callout.
 */
export const OneHeldChange: Story = {
  args: {
    transport: cannedTransport([{ text: WARMER, proposal: warmerProposal }]),
  },
  beforeEach: withLockedValues('--wa-color-brand'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await send(canvasElement, 'Make it warmer');

    const card = await canvas.findByText(WARMER);
    expect(card.localName).toBe('wa-card');
    const unlock = within(card).getByText('Unlock and apply');

    const held = await canvas.findByText('Locked, not changed: Brand Color.');
    expect(held.getAttribute('variant')).toBe('neutral');
    expect(belowCard(card, held)).toBe(true);
    expect(belowCard(card, canvas.getByText('Applied to the theme'))).toBe(
      true
    );
    expect(belowCard(card, canvas.getByText('Undo'))).toBe(true);

    await userEvent.click(unlock);

    const unlocked = await canvas.findByText(
      'Unlocked and applied: Brand Color.'
    );
    expect(unlocked.getAttribute('variant')).toBe('success');
    expect(belowCard(card, unlocked)).toBe(true);
    expect(
      canvas.queryByText('Locked, not changed: Brand Color.')
    ).not.toBeInTheDocument();
    expect(
      within(card).queryByText('Unlock and apply')
    ).not.toBeInTheDocument();
  },
};

/**
 * Two locked values: one button for all and one per value. Applying one
 * leaves the other held, with its own button.
 */
export const TwoHeldChanges: Story = {
  args: {
    transport: cannedTransport([{ text: WARMER, proposal: warmerProposal }]),
  },
  beforeEach: withLockedValues('--wa-color-brand', '--wa-border-radius-scale'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await send(canvasElement, 'Make it warmer');

    const card = await canvas.findByText(WARMER);
    within(card).getByText('Unlock and apply all');
    within(card).getByText('Radius Scale');
    await canvas.findByText('Locked, not changed: Brand Color; Radius Scale.');

    await userEvent.click(within(card).getByText('Brand Color'));

    await canvas.findByText('Unlocked and applied: Brand Color.');
    expect(
      canvas.getByText('Locked, not changed: Radius Scale.')
    ).toBeInTheDocument();
    expect(
      within(card).queryByText('Unlock and apply all')
    ).not.toBeInTheDocument();
    const rest = within(card).getByText('Unlock and apply');
    expect(rest.textContent).toContain('Radius Scale');
  },
};

const HEADER_RULE =
  'No value draws a rule under one part of a card, so this is custom CSS.';

/**
 * Locked custom CSS: the answer's custom CSS is one held change, its diff in
 * the card above its "Unlock and apply", which replaces the custom CSS whole.
 */
export const HeldCustomCSS: Story = {
  args: {
    transport: cannedTransport([
      {
        text: HEADER_RULE,
        proposal: {
          light: {},
          dark: {},
          customCSS: [
            '.Card::part(base) { border: none; }',
            '.Card::part(header) { border-bottom: var(--wa-border-width-s) solid var(--wa-color-surface-border); }',
          ].join('\n'),
        },
      },
    ]),
  },
  beforeEach: withStoredLocks(CUSTOM_CSS_LOCK),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await send(
      canvasElement,
      'No border on cards, only a rule under the header'
    );

    const card = await canvas.findByText(HEADER_RULE);
    // React sets `summary` as the element's property, not an attribute.
    const diff = card.querySelector<HTMLElement & { summary: string }>(
      'wa-details'
    );
    if (!diff) throw new Error('no custom CSS diff in the card');
    expect(diff.summary).toBe('Custom CSS changes');
    const added = diff.querySelectorAll('ins');
    expect(added).toHaveLength(2);
    expect(added[0].textContent).toBe(
      'Added: + .Card::part(base) { border: none; }'
    );
    expect(diff.querySelectorAll('del')).toHaveLength(0);
    // Long lines wrap, so every highlight spans the whole block and
    // nothing scrolls sideways.
    diff.setAttribute('open', '');
    await waitFor(() => {
      const pre = diff.querySelector('pre');
      if (!pre || pre.clientWidth === 0) throw new Error('diff not shown');
      expect(pre.scrollWidth).toBeLessThanOrEqual(pre.clientWidth);
      for (const line of pre.children) {
        expect((line as HTMLElement).offsetWidth).toBe(pre.clientWidth);
      }
    });
    // Copy takes the custom CSS as proposed, without the removed lines.
    const copy = diff.querySelector<HTMLElement & { value: string }>(
      'wa-copy-button'
    );
    // An icon button alone, in the code block's top right corner.
    const pre = diff.querySelector('pre');
    if (!copy || !pre) throw new Error('no copy button or code block');
    expect(
      [...(copy.parentElement?.childNodes ?? [])].filter(
        (node) => node !== copy && node !== pre && node.textContent?.trim()
      )
    ).toEqual([]);
    const button = copy.getBoundingClientRect();
    const block = pre.getBoundingClientRect();
    expect(block.right - button.right).toBeLessThan(16);
    expect(button.top - block.top).toBeLessThan(16);
    expect(button.right).toBeLessThanOrEqual(block.right);
    expect(button.top).toBeGreaterThanOrEqual(block.top);
    expect(copy?.value).toBe(
      [
        '.Card::part(base) { border: none; }',
        '.Card::part(header) { border-bottom: var(--wa-border-width-s) solid var(--wa-color-surface-border); }',
      ].join('\n')
    );
    await canvas.findByText('Locked, not changed: Custom CSS.');

    await userEvent.click(within(card).getByText('Unlock and apply'));

    await canvas.findByText('Unlocked and applied: Custom CSS.');
    expect(card.querySelector('wa-details')).toBeNull();
  },
};

/**
 * While an answer runs, the next message can be written; Enter does not
 * send it.
 */
const neverFinishes = cannedTransport([{ running: true }]);

export const TypingWhileAnswering: Story = {
  args: { transport: neverFinishes },
  beforeEach: withLockedValues(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await send(canvasElement, 'Make it warmer');
    await canvas.findByText('Thinking…');
    // Sending emptied the field. user-event never saw that: it tracks a
    // field's value from document focus events, which see the wa-textarea,
    // not the textarea in its shadow root. Typing over all of what it holds
    // puts it back in step with the field.
    const field = messageField(canvasElement);
    expect(field.value).toBe('');
    field.focus();
    await userEvent.type(field, 'Rounder corners', {
      skipClick: true,
      initialSelectionStart: 0,
      initialSelectionEnd: Number.MAX_SAFE_INTEGER,
    });
    expect(field.value).toBe('Rounder corners');

    await userEvent.keyboard('{Enter}');
    // A send clears the field and adds the message in the render after the
    // key, and Web Awesome paints the field before the next frame: once that
    // frame is here, a send would show.
    await new Promise(requestAnimationFrame);
    expect(field.value).toBe('Rounder corners');
    expect(neverFinishes.sent).toBe(1);
    expect(canvas.queryByText('Rounder corners')).not.toBeInTheDocument();
    expect(canvas.getByText('Thinking…')).toBeInTheDocument();
  },
};

/**
 * An answer that ran out of output while thinking says so below the user's
 * message: it has no text and no proposal, and once rendered nothing at all.
 */
export const AnswerOutOfOutput: Story = {
  args: { transport: cannedTransport([{ thinkingOnly: true }]) },
  beforeEach: withLockedValues(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await send(canvasElement, 'No border on cards');

    const report = await canvas.findByText(
      'No valid theme came back. Nothing was applied.',
      { exact: false }
    );
    expect(report.closest('wa-callout')?.getAttribute('variant')).toBe(
      'warning'
    );
    await canvas.findByText(
      'The answer hit its length limit before the proposal was complete.'
    );
    expect(canvas.queryByText('Thinking…')).not.toBeInTheDocument();
  },
};

/** Studio's defaults as the Theme Agent reads them. */
function defaultTheme(): CustomTheme {
  const theme: CustomTheme = {
    light: {},
    dark: {},
    shadowComponents: [],
    customCSS: '',
  };
  for (const [cssVar, value] of Object.entries(DEFAULT_VALUES)) {
    theme.light[cssVar] = value.light;
    theme.dark[cssVar] = value.dark;
  }
  return theme;
}

/**
 * What the tab saved before a reload: the answer to "Make it warmer" came in
 * with the brand locked, so its brand is held.
 */
function withConversationBeforeReload() {
  const locks = withLockedValues('--wa-color-brand');
  return () => {
    const restore = locks();
    const brandLock = {
      light: ['--wa-color-brand'],
      dark: ['--wa-color-brand'],
      shadowComponents: false,
      customCSS: false,
    };
    const conversation = createThemeAgentConversation();
    conversation.messageSent(defaultTheme(), brandLock);
    conversation.answerReceived(
      'answer-1',
      [warmerProposal],
      defaultTheme(),
      brandLock
    );
    conversation.answerFinished('answer-1');
    saveConversation({
      chatId: 'chat-before-reload',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Make it warmer' }],
        },
        {
          id: 'answer-1',
          role: 'assistant',
          parts: [{ type: 'text', text: WARMER }],
        },
      ],
      conversation: conversation.save(),
      cutOff: [],
    });
    return restore;
  };
}

/**
 * After a reload the conversation is back: its messages, the held brand with
 * "Unlock and apply", and Undo of what that applied. "New chat" ends it, so
 * the next reload starts fresh.
 */
export const RestoredAfterReload: Story = {
  args: { transport: cannedTransport([]) },
  beforeEach: withConversationBeforeReload(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(await canvas.findByText('Make it warmer')).toBeInTheDocument();
    const card = await canvas.findByText(WARMER);
    await canvas.findByText('Locked, not changed: Brand Color.');

    await userEvent.click(within(card).getByText('Unlock and apply'));
    await canvas.findByText('Unlocked and applied: Brand Color.');

    await userEvent.click(canvas.getByText('Undo'));
    await canvas.findByText('Undone');

    await userEvent.click(canvas.getByText('New chat'));
    await waitFor(() =>
      expect(canvas.queryByText(WARMER)).not.toBeInTheDocument()
    );
    expect(loadConversation()).toBeUndefined();
  },
};

/**
 * While the next answer streams, Undo of an earlier one is saved at once:
 * a reload in the middle of the answer keeps it. The answer itself is not
 * saved; the reload resumes it from the session.
 */
export const SavedWhileAnswering: Story = {
  args: {
    transport: cannedTransport([{ streaming: 'Rounding the corners' }]),
  },
  beforeEach: withConversationBeforeReload(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(WARMER);
    await send(canvasElement, 'Rounder corners');
    // The answer is streaming: its text is on screen, and it is not done.
    await canvas.findByText('Rounding the corners');
    expect(canvas.getByText('Thinking…')).toBeInTheDocument();

    await userEvent.click(canvas.getByText('Undo'));
    await canvas.findByText('Undone');

    const saved = loadConversation();
    expect(saved?.conversation.answers[0]?.undone).toBe(true);
    expect(saved?.messages.at(-1)?.role).toBe('user');
    expect(saved?.messages).toHaveLength(3);
  },
};
