import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FileInput } from '@/components/ui';

/** File inputs allow users to select and upload files from their device */
const meta = {
  title: 'Components/File Input',
  component: FileInput,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text', description: 'Accessible label for the input' },
    hint: { control: 'text', description: 'Descriptive hint text' },
    accept: {
      control: 'text',
      description: 'Accepted file types (MIME types or extensions)',
    },
    multiple: {
      control: 'boolean',
      description: 'Allow multiple file selection',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
      table: { defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Makes field mandatory',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'Input size',
      table: { defaultValue: { summary: 'medium' } },
    },
    onInput: {
      action: 'input',
      description: 'Emitted when file selection changes.',
      table: { category: 'Events' },
    },
    onChange: {
      action: 'change',
      description: 'Emitted when files are added or removed.',
      table: { category: 'Events' },
    },
    onFocus: {
      action: 'focus',
      description: 'Emitted when the dropzone gains focus.',
      table: { category: 'Events' },
    },
    onBlur: {
      action: 'blur',
      description: 'Emitted when the dropzone loses focus.',
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
    onFocus: fn(),
    onBlur: fn(),
    onInvalid: fn(),
  },
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic file input with a label and hint. */
export const Default: Story = {
  args: {
    label: 'Upload a file',
    hint: 'Drag and drop a file here or click to browse.',
  },
};

/** Allows selecting more than one file at a time. */
export const MultipleFiles: Story = {
  args: {
    label: 'Upload images',
    multiple: true,
    hint: 'You can select multiple files.',
  },
};

/** Restricts selection to image files only. */
export const AcceptImages: Story = {
  args: {
    label: 'Upload an image',
    accept: 'image/*',
    hint: 'Only image files are accepted (JPG, PNG, GIF, WebP, etc.).',
  },
};

/** The input is non-interactive when disabled. */
export const Disabled: Story = {
  args: {
    label: 'Upload a file',
    disabled: true,
  },
};

/** Shows all three available sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <FileInput
          key={size}
          label={`${size.charAt(0).toUpperCase() + size.slice(1)} size`}
          size={size}
        />
      ))}
    </div>
  ),
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
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <FileInput
        label="Default"
        hint="Drag and drop a file here or click to browse."
      />
      <FileInput
        label="Multiple files"
        multiple
        hint="Select multiple files."
      />
      <FileInput label="Images only" accept="image/*" />
      <FileInput label="Disabled" disabled />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FileInput label="Small" size="small" />
        <FileInput label="Large" size="large" />
      </div>
    </div>
  ),
};
