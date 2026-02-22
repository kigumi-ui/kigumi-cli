import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FileInput } from '@/components/ui';

/**
 * File Input provides a drag-and-drop dropzone for selecting files from a device.
 * It supports single and multiple file selection, file type filtering via the `accept`
 * prop, and optional limits on file count and size. Visual feedback updates as files
 * are added, removed, or dragged over the dropzone.
 */
const meta = {
  title: 'Components/File Input',
  component: FileInput,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    accept: {
      control: 'text',
      description:
        'Comma-separated list of accepted MIME types or file extensions',
    },
    onInput: { action: 'input' },
    onChange: { action: 'change' },
    onFocus: { action: 'focus' },
    onBlur: { action: 'blur' },
  },
  args: {
    label: 'Upload a file',
    onInput: fn(),
    onChange: fn(),
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
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
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
