import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { APICallError, simulateReadableStream, type UIMessageChunk } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/components/ui';
import type { ThemeAgentTransport } from '@/kigumi-studio/components/theme-agent/ThemeAgentChat';
import { ThemeAgentSidebar } from '@/kigumi-studio/components/theme-agent/ThemeAgentSidebar';
import {
  StudioProvider,
  useStudio,
} from '@/kigumi-studio/contexts/StudioContext';
import {
  THEME_AGENT_ENDPOINT,
  THEME_AGENT_PROPOSE_TOOL,
} from '@/kigumi-studio/theme-agent/constants';
import { removeOwnKey } from '@/kigumi-studio/theme-agent/own-key';
import { clearConversation } from '@/kigumi-studio/theme-agent/stored-conversation';
import type { ThemeProposalInput } from '@/kigumi-studio/theme-agent/proposal';

// The Theme Agent on an own key, in a real browser: the cog, the settings
// dialog, the key kept in the tab, and an answer from the answer loop
// running in the browser. Only Anthropic is replaced, by the AI SDK's mock
// model (the panel's `ownKeyModel`); the own-key transport, the answer loop
// with its validation and contrast check, and Studio's conversation module
// are the real ones.

/** An obvious placeholder with the shape of an Anthropic API key. */
const PLACEHOLDER_KEY =
  'sk-ant-api03-placeholder-key-for-the-own-key-stories-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

type StreamResult = Extract<
  NonNullable<ConstructorParameters<typeof MockLanguageModelV4>[0]>['doStream'],
  unknown[]
>[number];

const usage = {
  inputTokens: {
    total: 1,
    noCache: 1,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

function proposalStep(proposal: ThemeProposalInput): StreamResult {
  return {
    stream: simulateReadableStream({
      chunks: [
        {
          type: 'tool-call',
          toolCallId: 'proposal-1',
          toolName: THEME_AGENT_PROPOSE_TOOL,
          input: JSON.stringify(proposal),
        },
        {
          type: 'finish',
          finishReason: { unified: 'tool-calls', raw: undefined },
          usage,
        },
      ],
    }),
  };
}

function textStep(text: string): StreamResult {
  return {
    stream: simulateReadableStream({
      chunks: [
        { type: 'text-start', id: 'text-1' },
        { type: 'text-delta', id: 'text-1', delta: text },
        { type: 'text-end', id: 'text-1' },
        {
          type: 'finish',
          finishReason: { unified: 'stop', raw: undefined },
          usage,
        },
      ],
    }),
  };
}

const WARMER = 'A warmer theme: a terracotta brand, as asked.';
const TERRACOTTA = '#c2410c';

/**
 * A model that proposes a terracotta brand, then explains once the answer
 * loop has sent the proposal's result back.
 */
const warmerModel = new MockLanguageModelV4({
  doStream: async ({ prompt }) =>
    prompt.at(-1)?.role === 'tool'
      ? textStep(WARMER)
      : proposalStep({ light: { '--wa-color-brand': TERRACOTTA }, dark: {} }),
});

/**
 * A model that fails with `error` on the first message, then answers as
 * `warmerModel` does.
 */
function failingOnceModel(error: unknown) {
  let failed = false;
  return new MockLanguageModelV4({
    doStream: async (options) => {
      if (!failed) {
        failed = true;
        throw error;
      }
      return warmerModel.doStream(options);
    },
  });
}

/**
 * What the browser sees of an invalid key's 401, which carries no CORS
 * headers, and of a lost connection alike.
 */
const unansweredModel = failingOnceModel(new TypeError('Failed to fetch'));

const RATE_LIMIT_REASON =
  'Number of request tokens has exceeded your per-minute rate limit';

/**
 * A 429 the browser can read, retried at once (`retry-after-ms`) until the
 * AI SDK gives up, as it does with Anthropic's.
 */
const rateLimitedModel = new MockLanguageModelV4({
  doStream: async () => {
    throw new APICallError({
      message: RATE_LIMIT_REASON,
      url: 'https://api.anthropic.com/v1/messages',
      requestBodyValues: {},
      statusCode: 429,
      responseHeaders: { 'retry-after-ms': '0' },
      isRetryable: true,
    });
  },
});

const LOCKS_KEY = 'kigumi-studio-locks';
const STATE_KEY = 'kigumi-studio-state';

/** Start from Studio's defaults, no locks, no own key, no conversation. */
function freshStudio() {
  const saved = [LOCKS_KEY, STATE_KEY].map(
    (key) => [key, localStorage.getItem(key)] as const
  );
  for (const [key] of saved) localStorage.removeItem(key);
  removeOwnKey();
  clearConversation();
  return () => {
    removeOwnKey();
    clearConversation();
    for (const [key, value] of saved) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  };
}

/** The light brand colour of the custom theme, as the sidebar has it. */
function BrandProbe() {
  const { values } = useStudio();
  return (
    <output aria-label="Brand colour">
      {values['--wa-color-brand']?.light}
    </output>
  );
}

/** The `<input>` inside `dialog`'s labelled wa-input, in its shadow root. */
function inputField(dialog: HTMLElement, label: string): HTMLInputElement {
  // React sets the label as a property, not an attribute.
  const input = [
    ...dialog.querySelectorAll<HTMLElement & { label: string }>('wa-input'),
  ]
    .find((element) => element.label === label)
    ?.shadowRoot?.querySelector('input');
  if (!input) throw new Error(`${label} field not found`);
  return input;
}

/** The message field's own textarea, inside wa-textarea's shadow root. */
function messageField(canvasElement: HTMLElement): HTMLTextAreaElement {
  const textarea = canvasElement
    .querySelector('.theme-agent__composer wa-textarea')
    ?.shadowRoot?.querySelector('textarea');
  if (!textarea) throw new Error('message field not found');
  return textarea;
}

/** The cog: the button its icon and its tooltip name "Settings". */
function settingsButton(canvasElement: HTMLElement): HTMLElement {
  const button = within(canvasElement)
    .getAllByLabelText('Settings')
    .find((element) => element.localName === 'wa-button');
  if (!button) throw new Error('Settings button not found');
  return button;
}

/** The open wa-dialogs labelled `label`, wherever they are in the page. */
function openDialogs(label: string): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement & { label: string }>(
      'wa-dialog[open]'
    ),
  ].filter((dialog) => dialog.label === label);
}

/**
 * The settings dialog `trigger`, the cog by default, opened. The Dialog
 * wrapper renders into `document.body`, where an earlier story's dialog may
 * still be open, so it is the one that was not open before the click.
 */
async function openSettings(
  canvasElement: HTMLElement,
  trigger: HTMLElement = settingsButton(canvasElement)
): Promise<HTMLElement> {
  const before = openDialogs('Theme Agent settings');
  await userEvent.click(trigger);
  return waitFor(() => {
    const dialog = openDialogs('Theme Agent settings').find(
      (open) => !before.includes(open)
    );
    if (!dialog) throw new Error('settings dialog not open');
    return dialog;
  });
}

/** Whether the key field hides what it holds. */
function masked(field: HTMLInputElement): boolean {
  return (
    getComputedStyle(field).getPropertyValue('-webkit-text-security') === 'disc'
  );
}

/** Type `key` into the dialog's key field and press Save. */
async function enterKey(dialog: HTMLElement, key: string) {
  const field = await waitFor(() => inputField(dialog, 'Anthropic API key'));
  expect(masked(field)).toBe(true);
  // The dialog puts focus on the key field once it has opened.
  await waitFor(() =>
    expect((field.getRootNode() as ShadowRoot).activeElement).toBe(field)
  );
  await userEvent.keyboard(key);
  await userEvent.click(within(dialog).getByText('Save'));
}

function holds(storage: Storage, value: string): boolean {
  return Object.keys(storage).some((key) =>
    storage.getItem(key)?.includes(value)
  );
}

/** True when this tab's sessionStorage holds `value`, and localStorage does not. */
function keptInTab(value: string): boolean {
  return holds(sessionStorage, value) && !holds(localStorage, value);
}

/** True when localStorage holds `value`, and this tab's sessionStorage does not. */
function keptOnDevice(value: string): boolean {
  return holds(localStorage, value) && !holds(sessionStorage, value);
}

/** Another placeholder key, with last four characters of its own. */
const OTHER_KEY = `${PLACEHOLDER_KEY.slice(0, -4)}Ab12`;

type WaCheckbox = HTMLElement & { checked: boolean };

/** The dialog's "Remember on this device" checkbox. */
function rememberBox(dialog: HTMLElement): WaCheckbox {
  const box = within(dialog)
    .getByText('Remember on this device')
    .closest<WaCheckbox>('wa-checkbox');
  if (!box) throw new Error('Remember on this device not found');
  return box;
}

/**
 * Click the "Remember on this device" label, as a visitor does. Not the
 * host: its centre lies between the label and the hint, where a click does
 * nothing.
 */
async function toggleRemember(dialog: HTMLElement) {
  const label =
    rememberBox(dialog).shadowRoot?.querySelector<HTMLElement>(
      '[part~="label"]'
    );
  if (!label) throw new Error('Remember on this device label not found');
  await userEvent.click(label);
}

/** The key field's hint, which shows the saved key. */
function keyHint(dialog: HTMLElement): string {
  const hint = dialog.querySelector('wa-input [slot="hint"]');
  if (!hint) throw new Error('Anthropic API key hint not found');
  return hint.textContent ?? '';
}

/** Save `key` through the cog, remembered on this device. */
async function saveRemembered(canvasElement: HTMLElement, key: string) {
  const dialog = await openSettings(canvasElement);
  await toggleRemember(dialog);
  expect(rememberBox(dialog).checked).toBe(true);
  await enterKey(dialog, key);
  await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
}

const meta = {
  title: 'Studio/Theme Agent Own Key',
  component: ThemeAgentSidebar,
  // Maintainer-only like the other Theme Agent stories: listed locally,
  // tested in the interaction lane, left out of the published Storybook.
  tags: ['maintainer', '!autodocs', 'interaction'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, accessCookie: true, ownKeyModel: warmerModel },
  beforeEach: freshStudio,
  decorators: [
    (Story) => (
      <StudioProvider>
        <BrandProbe />
        <Story />
      </StudioProvider>
    ),
  ],
} satisfies Meta<typeof ThemeAgentSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A cookie holder saves an own key through the cog: the key stays in the
 * tab, the next message is answered in the browser, and the answer's
 * proposal is applied to the custom theme.
 */
export const AnswerFromOwnKey: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const brand = canvas.getByLabelText('Brand colour');
    expect(brand.textContent).not.toBe(TERRACOTTA);

    // The cog sits at the right end of the header, after "New chat".
    const header = canvasElement.querySelector('.studio-panel-header');
    const cog = settingsButton(canvasElement);
    const newChat = canvas.getByText('New chat').closest('wa-button');
    if (!header || !cog || !newChat) throw new Error('header not found');
    expect(cog.getAttribute('appearance')).toBe('plain');
    expect(
      newChat.compareDocumentPosition(cog) & Node.DOCUMENT_POSITION_FOLLOWING
    ).not.toBe(0);
    // The tooltip names the button, as Web Awesome links the two.
    const tooltip = document.getElementById(
      cog.getAttribute('aria-labelledby') ?? ''
    );
    expect(tooltip?.localName).toBe('wa-tooltip');
    expect(tooltip?.textContent).toBe('Settings');

    const dialog = await openSettings(canvasElement);
    expect(within(dialog).queryByText('Remove key')).not.toBeInTheDocument();
    await enterKey(dialog, PLACEHOLDER_KEY);
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
    expect(keptInTab(PLACEHOLDER_KEY)).toBe(true);

    const calls = warmerModel.doStreamCalls.length;
    const field = messageField(canvasElement);
    field.focus();
    await userEvent.keyboard('Make it warmer{Enter}');

    expect(await canvas.findByText(WARMER)).toBeInTheDocument();
    await canvas.findByText('Applied to the theme');
    expect(brand.textContent).toBe(TERRACOTTA);
    // The proposal, then the explanation after its result: the answer loop.
    expect(warmerModel.doStreamCalls.length - calls).toBe(2);
  },
};

/**
 * A value that is not shaped like an Anthropic API key is refused with the
 * reason, and nothing is saved.
 */
export const RejectsMalformedKey: Story = {
  play: async ({ canvasElement }) => {
    const dialog = await openSettings(canvasElement);
    await enterKey(dialog, 'sk-proj-placeholder');

    await within(dialog).findByText(
      'An Anthropic API key starts with sk-ant-api.'
    );
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(keptInTab('sk-proj-placeholder')).toBe(false);

    // Cancel closes it, still with nothing saved.
    await userEvent.click(within(dialog).getByText('Cancel'));
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
    expect(keptInTab('sk-proj-placeholder')).toBe(false);
  },
};

/** With a key saved, the dialog offers Remove key, which forgets it. */
export const RemoveKey: Story = {
  play: async ({ canvasElement }) => {
    let dialog = await openSettings(canvasElement);
    await enterKey(dialog, PLACEHOLDER_KEY);
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));

    dialog = await openSettings(canvasElement);
    await userEvent.click(within(dialog).getByText('Remove key'));
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
    expect(keptInTab(PLACEHOLDER_KEY)).toBe(false);

    dialog = await openSettings(canvasElement);
    expect(within(dialog).queryByText('Remove key')).not.toBeInTheDocument();
  },
};

/**
 * "Remember on this device" keeps the key for every tab; unticking it puts
 * the saved key back in this tab only, and Remove key forgets it in both.
 */
export const RememberOnThisDevice: Story = {
  play: async ({ canvasElement }) => {
    // Without a key there is nothing to remember: the dialog says so.
    let dialog = await openSettings(canvasElement);
    await toggleRemember(dialog);
    await within(dialog).findByText(
      'Enter an Anthropic API key to remember it.'
    );
    await userEvent.click(within(dialog).getByText('Cancel'));
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));

    await saveRemembered(canvasElement, PLACEHOLDER_KEY);
    expect(keptOnDevice(PLACEHOLDER_KEY)).toBe(true);

    dialog = await openSettings(canvasElement);
    expect(rememberBox(dialog).checked).toBe(true);
    // Per tab: unticked, Save moves the saved key without retyping it.
    await toggleRemember(dialog);
    await userEvent.click(within(dialog).getByText('Save'));
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
    expect(keptInTab(PLACEHOLDER_KEY)).toBe(true);

    await saveRemembered(canvasElement, OTHER_KEY);
    expect(keptOnDevice(OTHER_KEY)).toBe(true);
    expect(holds(sessionStorage, PLACEHOLDER_KEY)).toBe(false);
    dialog = await openSettings(canvasElement);
    await userEvent.click(within(dialog).getByText('Remove key'));
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
    expect(holds(localStorage, OTHER_KEY)).toBe(false);
    expect(holds(sessionStorage, OTHER_KEY)).toBe(false);
  },
};

/**
 * A saved key is shown only masked, with its last four characters; what is
 * typed can be revealed.
 */
export const MaskedKey: Story = {
  play: async ({ canvasElement }) => {
    let dialog = await openSettings(canvasElement);
    await enterKey(dialog, OTHER_KEY);
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));

    dialog = await openSettings(canvasElement);
    const hint = keyHint(dialog);
    expect(hint).toContain('Ab12');
    expect(hint).not.toContain(OTHER_KEY.slice(0, 12));
    const field = inputField(dialog, 'Anthropic API key');
    expect(field.value).toBe('');
    expect(document.body.innerHTML).not.toContain(OTHER_KEY);

    await waitFor(() =>
      expect((field.getRootNode() as ShadowRoot).activeElement).toBe(field)
    );
    await userEvent.keyboard('typed');
    expect(masked(field)).toBe(true);
    // The icon names the button, as on the cog.
    const reveal = within(dialog)
      .getByLabelText('Show key')
      .closest('wa-button');
    if (!reveal) throw new Error('Show key button not found');
    await userEvent.click(reveal);
    await waitFor(() => expect(masked(field)).toBe(false));
    expect(field.value).toBe('typed');
  },
};

/**
 * Cancel and Escape leave the saved key and where it is kept as they were,
 * and focus goes back to the cog.
 */
export const CancelChangesNothing: Story = {
  play: async ({ canvasElement }) => {
    await saveRemembered(canvasElement, PLACEHOLDER_KEY);
    const cog = settingsButton(canvasElement);

    for (const close of ['Cancel', 'Escape'] as const) {
      const dialog = await openSettings(canvasElement);
      const field = await waitFor(() =>
        inputField(dialog, 'Anthropic API key')
      );
      await waitFor(() =>
        expect((field.getRootNode() as ShadowRoot).activeElement).toBe(field)
      );
      await userEvent.keyboard(OTHER_KEY);
      await toggleRemember(dialog);
      expect(rememberBox(dialog).checked).toBe(false);

      if (close === 'Cancel') {
        await userEvent.click(within(dialog).getByText('Cancel'));
      } else {
        field.focus();
        await userEvent.keyboard('{Escape}');
      }
      await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
      expect(keptOnDevice(PLACEHOLDER_KEY)).toBe(true);
      expect(holds(localStorage, OTHER_KEY)).toBe(false);
      expect(holds(sessionStorage, OTHER_KEY)).toBe(false);
      await waitFor(() => expect(document.activeElement).toBe(cog));
    }

    const dialog = await openSettings(canvasElement);
    expect(rememberBox(dialog).checked).toBe(true);
    expect(keyHint(dialog)).toContain(PLACEHOLDER_KEY.slice(-4));
    expect(inputField(dialog, 'Anthropic API key').value).toBe('');
  },
};

/** The chat's message list, without its live regions. */
function chatMessages(canvasElement: HTMLElement) {
  const list = canvasElement.querySelector<HTMLElement>(
    '.theme-agent__messages'
  );
  if (!list) throw new Error('message list not found');
  return within(list);
}

/** The polite live region the chat announces its notices in. */
function announcements(canvasElement: HTMLElement): string {
  return [...canvasElement.querySelectorAll('[aria-live="polite"]')]
    .map((region) => region.textContent)
    .join(' ');
}

/** Save the placeholder key through the cog and send `text`. */
async function sendWithKey(canvasElement: HTMLElement, text: string) {
  const dialog = await openSettings(canvasElement);
  await enterKey(dialog, PLACEHOLDER_KEY);
  await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
  messageField(canvasElement).focus();
  await userEvent.keyboard(`${text}{Enter}`);
}

/**
 * Anthropic does not answer and the browser cannot read why: the chat names
 * the likely causes and opens the settings, nothing is applied, and once the
 * key is replaced the next message is answered.
 */
export const OwnKeyUnanswered: Story = {
  args: { ownKeyModel: unansweredModel },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const brand = canvas.getByLabelText('Brand colour');
    const before = brand.textContent;
    await sendWithKey(canvasElement, 'Make it warmer');

    const message = await chatMessages(canvasElement).findByText(
      /Anthropic did not answer/
    );
    for (const cause of ['API key', 'credit', 'connection']) {
      expect(message.textContent).toContain(cause);
    }
    await waitFor(() =>
      expect(announcements(canvasElement)).toContain('Anthropic did not answer')
    );
    expect(brand.textContent).toBe(before);

    // Its button opens the settings, where the key is replaced.
    const dialog = await openSettings(
      canvasElement,
      canvas.getByText('Open settings')
    );
    await enterKey(dialog, PLACEHOLDER_KEY);
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));

    messageField(canvasElement).focus();
    await userEvent.keyboard('Make it warmer{Enter}');
    await canvas.findByText('Applied to the theme');
    expect(brand.textContent).toBe(TERRACOTTA);
    expect(
      chatMessages(canvasElement).queryByText(/Anthropic did not answer/)
    ).toBeNull();
  },
};

/**
 * Anthropic rate limits the key and the browser can read it: the chat gives
 * that reason and says to wait, with no settings button.
 */
export const OwnKeyRateLimited: Story = {
  args: { ownKeyModel: rateLimitedModel },
  play: async ({ canvasElement }) => {
    await sendWithKey(canvasElement, 'Make it warmer');
    // Saving the first key started a new conversation, with its own list.
    const chat = chatMessages(canvasElement);

    const message = await chat.findByText(/rate limiting your API key/);
    expect(message.textContent).toContain(RATE_LIMIT_REASON);
    expect(message.textContent).toContain('Wait a minute');
    expect(chat.queryByText('Open settings')).toBeNull();
    expect(chat.queryByText(/Anthropic did not answer/)).toBeNull();
  },
};

const HOSTED_ANSWER = 'Teal it is, from the trigger.dev task.';

/**
 * The trigger.dev path without trigger.dev: every message is answered with
 * `HOSTED_ANSWER`, and once one was sent there is a session to close.
 */
function hostedTransport(): ThemeAgentTransport {
  const sessions = new Set<string>();
  return {
    getSession: (chatId) =>
      sessions.has(chatId)
        ? { publicAccessToken: 'placeholder-token' }
        : undefined,
    reconnectToStream: async () => null,
    sendMessages: async ({ chatId }) => {
      sessions.add(chatId);
      return simulateReadableStream<UIMessageChunk>({
        chunks: [
          { type: 'start' },
          { type: 'text-start', id: 'text-1' },
          { type: 'text-delta', id: 'text-1', delta: HOSTED_ANSWER },
          { type: 'text-end', id: 'text-1' },
          { type: 'finish' },
        ],
      });
    },
  };
}

/** The chat ids whose trigger.dev session the browser asked to close. */
let closedSessions: string[] = [];

/** Answer `/api/theme-agent` in place of the Vercel Function, recording each close. */
function withThemeAgentEndpoint() {
  closedSessions = [];
  const realFetch = window.fetch.bind(window);
  const spy = spyOn(window, 'fetch').mockImplementation(async (input, init) => {
    if (input !== THEME_AGENT_ENDPOINT) return realFetch(input, init);
    const { intent, chatId } = JSON.parse(String(init?.body)) as {
      intent: string;
      chatId: string;
    };
    if (intent === 'close') closedSessions.push(chatId);
    return new Response('{}');
  });
  return () => spy.mockRestore();
}

/** Save `key` through the cog, kept in this tab. */
async function saveKey(canvasElement: HTMLElement, key: string) {
  const dialog = await openSettings(canvasElement);
  await enterKey(dialog, key);
  await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
}

/**
 * Type `text` over all the message field holds. user-event tracks the
 * field's value from focus events, which see the wa-textarea, not the
 * textarea in its shadow root, so it never saw a send empty it.
 */
async function typeMessage(canvasElement: HTMLElement, text: string) {
  const field = messageField(canvasElement);
  field.focus();
  await userEvent.type(field, text, {
    skipClick: true,
    initialSelectionStart: 0,
    initialSelectionEnd: Number.MAX_SAFE_INTEGER,
  });
}

/** Send `text` from the message field. */
async function send(canvasElement: HTMLElement, text: string) {
  await typeMessage(canvasElement, text);
  await userEvent.keyboard('{Enter}');
}

/**
 * A cookie holder saves an own key during a trigger.dev conversation: it
 * ends as "New chat" ends it, its session is closed, the draft stays, and
 * the next message is answered with the own key.
 */
export const OwnKeyEndsHostedConversation: Story = {
  args: { transport: hostedTransport() },
  beforeEach: withThemeAgentEndpoint,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await send(canvasElement, 'Teal please');
    await canvas.findByText(HOSTED_ANSWER);
    await typeMessage(canvasElement, 'Keep this draft');

    await saveKey(canvasElement, PLACEHOLDER_KEY);

    await waitFor(() =>
      expect(canvas.queryByText(HOSTED_ANSWER)).not.toBeInTheDocument()
    );
    expect(canvas.queryByText('Teal please')).not.toBeInTheDocument();
    expect(closedSessions).toHaveLength(1);
    expect(messageField(canvasElement).value).toBe('Keep this draft');

    // The kept draft goes to the own key.
    messageField(canvasElement).focus();
    await userEvent.keyboard('{Enter}');
    await canvas.findByText('Applied to the theme');
    expect(canvas.getByLabelText('Brand colour').textContent).toBe(TERRACOTTA);
  },
};

/** Replacing the own key with another keeps the conversation and its Undo. */
export const ReplacingKeyKeepsConversation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await saveKey(canvasElement, PLACEHOLDER_KEY);
    await send(canvasElement, 'Make it warmer');
    await canvas.findByText('Applied to the theme');

    await saveKey(canvasElement, OTHER_KEY);

    expect(canvas.getByText(WARMER)).toBeInTheDocument();
    await userEvent.click(canvas.getByText('Undo'));
    await canvas.findByText('Undone');
  },
};

/**
 * Removing the own key with the cookie present ends the own-key
 * conversation, and the next message is answered on the trigger.dev path.
 */
export const RemovingKeyEndsConversation: Story = {
  args: { transport: hostedTransport() },
  beforeEach: withThemeAgentEndpoint,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await saveKey(canvasElement, PLACEHOLDER_KEY);
    await send(canvasElement, 'Make it warmer');
    await canvas.findByText(WARMER);

    const dialog = await openSettings(canvasElement);
    await userEvent.click(within(dialog).getByText('Remove key'));
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));

    await waitFor(() =>
      expect(canvas.queryByText(WARMER)).not.toBeInTheDocument()
    );
    // No trigger.dev session was open: the own key's answers ran here.
    expect(closedSessions).toHaveLength(0);
    await send(canvasElement, 'Teal please');
    await canvas.findByText(HOSTED_ANSWER);
  },
};

const TEAL = '#0e7490';

/**
 * A model that answers as `warmerModel` does, except for the second answer:
 * it proposes a teal brand and is still being written when the page
 * reloads.
 */
function interruptedSecondModel() {
  let calls = 0;
  return new MockLanguageModelV4({
    doStream: async (options) => {
      calls += 1;
      if (calls === 3) {
        return proposalStep({ light: { '--wa-color-brand': TEAL }, dark: {} });
      }
      // The explanation after the proposal's result never comes.
      if (calls === 4) return { stream: new ReadableStream() };
      return warmerModel.doStream(options);
    },
  });
}

/**
 * The panel with a "Reload" button that mounts it afresh, as a reload
 * does: everything it shows comes back from the tab's storage.
 */
function ReloadablePanel(props: ComponentProps<typeof ThemeAgentSidebar>) {
  const [loads, setLoads] = useState(0);
  return (
    <>
      <Button size="small" onClick={() => setLoads((n) => n + 1)}>
        Reload
      </Button>
      <ThemeAgentSidebar key={loads} {...props} />
    </>
  );
}

/**
 * A reload while an own-key answer is being written: the conversation comes
 * back with the earlier answer and its Undo, the interrupted answer comes
 * back cut off with nothing of its accepted proposal applied, and the next
 * message is answered and applied.
 */
export const ReloadDuringOwnKeyAnswer: Story = {
  args: { accessCookie: false, ownKeyModel: interruptedSecondModel() },
  render: (args) => <ReloadablePanel {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const brand = canvas.getByLabelText('Brand colour');
    const before = brand.textContent;
    const model = args.ownKeyModel as MockLanguageModelV4;
    const calls = model.doStreamCalls.length;
    await saveKey(canvasElement, PLACEHOLDER_KEY);
    await send(canvasElement, 'Make it warmer');
    await canvas.findByText('Applied to the theme');
    await send(canvasElement, 'Try teal');
    // The teal proposal was accepted and its result sent back: the answer
    // is waiting for the model's explanation.
    await waitFor(() => expect(model.doStreamCalls.length - calls).toBe(4));

    await userEvent.click(canvas.getByText('Reload'));

    await canvas.findByText(
      'A reload interrupted the answer before it was complete.'
    );
    expect(
      canvas.getByText('No valid theme came back. Nothing was applied.', {
        exact: false,
      })
    ).toBeInTheDocument();
    expect(canvas.getByText('Try teal')).toBeInTheDocument();
    expect(canvas.queryByText('Thinking…')).not.toBeInTheDocument();
    expect(brand.textContent).toBe(TERRACOTTA);

    // The earlier answer came back with its Undo.
    expect(canvas.getByText(WARMER)).toBeInTheDocument();
    await userEvent.click(canvas.getByText('Undo'));
    await canvas.findByText('Undone');
    expect(brand.textContent).toBe(before);

    await send(canvasElement, 'Make it warmer again');
    await waitFor(() => expect(brand.textContent).toBe(TERRACOTTA));
    await canvas.findByText('Applied to the theme');
  },
};
