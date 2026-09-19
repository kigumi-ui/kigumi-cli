import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { Icon, TagInput } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/** Tag inputs collect a list of short values, such as keywords or labels, as removable tags */
const meta = {
  title: 'Components/Tag Input',
  component: TagInput,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: "The tag input's label" },
    hint: { control: 'text', description: "The tag input's hint" },
    value: {
      control: 'text',
      description: 'Default value as a delimiter-separated string',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown in the text box',
    },
    delimiter: {
      control: 'text',
      description: 'Characters that turn typed text into a tag',
      table: { defaultValue: { summary: ',' } },
    },
    'max-tags': {
      control: 'number',
      description: 'The maximum number of tags that can be added',
    },
    'min-tags': {
      control: 'number',
      description:
        'The minimum number of tags required for the control to be valid',
    },
    'allow-duplicates': {
      control: 'boolean',
      description: 'Allows the same tag to be added more than once',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-clear': {
      control: 'boolean',
      description: 'Adds a clear button that removes all tags',
      table: { defaultValue: { summary: 'false' } },
    },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined'],
      description: 'Visual appearance',
      table: { defaultValue: { summary: 'outlined' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: "The tag input's size",
      table: { defaultValue: { summary: 'medium' } },
    },
    pill: {
      control: 'boolean',
      description: 'Draws a pill-style tag input with rounded edges',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Requires at least one tag',
      table: { defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Makes the tag input readonly',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the form control',
      table: { defaultValue: { summary: 'false' } },
    },
    name: {
      control: 'text',
      description: 'The name of the input, submitted with form data',
    },
    onInput: {
      action: 'input',
      description:
        'Emitted when the user types in the text box or when a tag is added or removed.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description:
        'Emitted when a tag is added, removed, or all tags are cleared by the user.',
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the control loses focus.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the control gains focus.',
      table: { category: 'Events' },
    },
    onCreate: {
      action: 'create',
      description:
        'Emitted before typed text becomes a tag. Call `event.preventDefault()` to reject it. The event `detail` contains `{ inputValue: string }`, the text that would become the tag.',
      table: { category: 'Events' },
    },
    onClear: {
      action: 'clear',
      description: 'Emitted when the clear button is activated.',
      table: { category: 'Events' },
    },
    onInvalid: {
      action: 'invalid',
      description:
        "Emitted when the form control has been checked for validity and its constraints aren't satisfied.",
      table: { category: 'Events' },
    },
  },
  args: {
    onInput: fn(),
    onChange: fn(),
    onBlur: fn(),
    onFocus: fn(),
    onCreate: fn(),
    onClear: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A labelled field that turns typed text into tags. */
export const Default: Story = {
  tags: ['interaction'],
  args: { label: 'Keywords', placeholder: 'Add a keyword' },
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-tag-input');
    if (!host) throw new Error('wa-tag-input not found');
    const cleanup = installEventProbe(host, 'change', args.onChange);
    const innerInput =
      host.shadowRoot?.querySelector<HTMLInputElement>('input');
    if (!innerInput) throw new Error('wa-tag-input shadow input not found');
    innerInput.focus();
    await userEvent.keyboard('design{Enter}');
    await waitForCalled(args, 'onChange');
    cleanup();
  },
};

/** Prefills tags and shows a hint. */
export const WithValue: Story = {
  args: {
    label: 'Topics',
    hint: 'Press Enter or type a comma after each topic.',
    value: 'Design, CSS',
    'with-clear': true,
  },
  render: (args) => (
    <TagInput {...args}>
      <Icon slot="start" name="tag" />
    </TagInput>
  ),
};

/** Caps how many tags can be added. */
export const MaxTags: Story = {
  args: {
    label: 'Up to three',
    'max-tags': 3,
    value: 'one, two',
  },
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '1.5rem',
        maxWidth: '400px',
      }}
    >
      <TagInput label="Default" placeholder="Add a keyword" />
      <TagInput
        label="With tags"
        value="design, accessibility"
        {...{ 'with-clear': true }}
      />
      <TagInput label="Pill" pill value="one, two" />
      <TagInput label="Disabled" disabled value="locked" />
      <TagInput label="Small" size="small" value="xs" />
    </div>
  ),
};
