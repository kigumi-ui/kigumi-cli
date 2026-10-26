import type { Meta, StoryObj } from '@storybook/react-vite';
import type { UIMessageChunk } from 'ai';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ThemeAgentSidebar } from '@/kigumi-studio/components/theme-agent/ThemeAgentSidebar';
import type { ThemeAgentTransport } from '@/kigumi-studio/components/theme-agent/ThemeAgentChat';
import { StudioProvider } from '@/kigumi-studio/contexts/StudioContext';
import { THEME_AGENT_PROPOSE_TOOL } from '@/kigumi-studio/theme-agent/constants';
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
  { text: string; proposal: ThemeProposalInput } | { running: true };

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
  return () => {
    const saved = [LOCKS_KEY, STATE_KEY].map(
      (key) => [key, localStorage.getItem(key)] as const
    );
    localStorage.removeItem(STATE_KEY);
    localStorage.setItem(
      LOCKS_KEY,
      JSON.stringify({
        light: cssVars,
        dark: cssVars,
        shadowComponents: false,
      })
    );
    return () => {
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
  // Maintainer-only: tested in the interaction lane, not listed in the
  // published Storybook.
  tags: ['!dev', '!autodocs', 'interaction'],
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
