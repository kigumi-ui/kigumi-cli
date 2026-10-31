import type { Meta, StoryObj } from '@storybook/react-vite';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ThemeAgentSidebar } from '@/kigumi-studio/components/theme-agent/ThemeAgentSidebar';
import {
  StudioProvider,
  useStudio,
} from '@/kigumi-studio/contexts/StudioContext';
import { THEME_AGENT_PROPOSE_TOOL } from '@/kigumi-studio/theme-agent/constants';
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
 * The settings dialog the cog opened. The Dialog wrapper renders into
 * `document.body`, where an earlier story's dialog may still be open, so it
 * is the one that was not open before the click.
 */
async function openSettings(canvasElement: HTMLElement): Promise<HTMLElement> {
  const before = openDialogs('Theme Agent settings');
  await userEvent.click(settingsButton(canvasElement));
  return waitFor(() => {
    const dialog = openDialogs('Theme Agent settings').find(
      (open) => !before.includes(open)
    );
    if (!dialog) throw new Error('settings dialog not open');
    return dialog;
  });
}

/** Type `key` into the dialog's key field and press Save. */
async function enterKey(dialog: HTMLElement, key: string) {
  const field = await waitFor(() => inputField(dialog, 'Anthropic API key'));
  expect(field.type).toBe('password');
  // The dialog puts focus on the key field once it has opened.
  await waitFor(() =>
    expect((field.getRootNode() as ShadowRoot).activeElement).toBe(field)
  );
  await userEvent.keyboard(key);
  await userEvent.click(within(dialog).getByText('Save'));
}

/** True when this tab's sessionStorage holds `value`, and localStorage does not. */
function keptInTab(value: string): boolean {
  const holds = (storage: Storage) =>
    Object.keys(storage).some((key) => storage.getItem(key)?.includes(value));
  return holds(sessionStorage) && !holds(localStorage);
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
