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
  const field = [
    ...dialog.querySelectorAll<HTMLElement & { label: string; hint: string }>(
      'wa-input'
    ),
  ].find((element) => element.label === 'Anthropic API key');
  if (!field) throw new Error('Anthropic API key field not found');
  return field.hint;
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
    await saveRemembered(canvasElement, PLACEHOLDER_KEY);
    expect(keptOnDevice(PLACEHOLDER_KEY)).toBe(true);

    let dialog = await openSettings(canvasElement);
    expect(rememberBox(dialog).checked).toBe(true);
    // wa-checkbox renders the hint from its property, in its shadow root.
    expect((rememberBox(dialog) as WaCheckbox & { hint: string }).hint).toMatch(
      /any script on this page can read a remembered key/i
    );
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
    expect(field.type).toBe('password');
    const reveal = (
      field.getRootNode() as ShadowRoot
    ).querySelector<HTMLElement>('[part~="password-toggle-button"]');
    if (!reveal) throw new Error('reveal button not found');
    await userEvent.click(reveal);
    expect(field.type).toBe('text');
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
