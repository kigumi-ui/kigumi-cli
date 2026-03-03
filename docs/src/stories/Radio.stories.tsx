import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from '@/components/ui';

/** Radios allow the user to select a single option from a group */
const meta = {
  title: 'Components/Radio',
  component: Radio,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text', description: 'The radio value' },
    disabled: {
      control: 'boolean',
      description: 'Disables the radio',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Radio size',
      table: { defaultValue: { summary: 'medium' } },
    },
    appearance: {
      control: 'select',
      options: ['default', 'button'],
      description: 'Radio appearance style',
      table: { defaultValue: { summary: 'default' } },
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
  },
  args: {
    onBlur: fn(),
    onFocus: fn(),
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A standalone radio button with a label. */
export const Default: Story = {
  render: (args) => (
    <RadioGroup label="Choose an option">
      <Radio {...args}>Radio Button</Radio>
      <Radio value="b">Option B</Radio>
      <Radio value="c">Option C</Radio>
    </RadioGroup>
  ),
};

/** Renders the radio as a filled button for segmented-control usage. */
export const ButtonAppearance: Story = {
  args: { appearance: 'button' },
  render: () => (
    <RadioGroup label="View mode">
      <Radio value="list" appearance="button">
        List
      </Radio>
      <Radio value="grid" appearance="button">
        Grid
      </Radio>
      <Radio value="table" appearance="button">
        Table
      </Radio>
    </RadioGroup>
  ),
};

/** Shows small, medium, and large radio sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <RadioGroup key={size} label={`Size: ${size}`}>
          <Radio value="a" size={size}>
            Option A
          </Radio>
          <Radio value="b" size={size}>
            Option B
          </Radio>
          <Radio value="c" size={size}>
            Option C
          </Radio>
        </RadioGroup>
      ))}
    </div>
  ),
};

/** A non-interactive disabled radio option. */
export const Disabled: Story = {
  render: () => (
    <RadioGroup label="Subscription" value="monthly">
      <Radio value="monthly">Monthly</Radio>
      <Radio value="yearly">Yearly (save 20%)</Radio>
      <Radio value="enterprise" disabled>
        Enterprise (contact sales)
      </Radio>
    </RadioGroup>
  ),
};

/** Button-appearance radios at all three sizes. */
export const ButtonSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <RadioGroup key={size} label={`Button size: ${size}`}>
          <Radio value="a" appearance="button" size={size}>
            Alpha
          </Radio>
          <Radio value="b" appearance="button" size={size}>
            Beta
          </Radio>
          <Radio value="c" appearance="button" size={size}>
            Gamma
          </Radio>
        </RadioGroup>
      ))}
    </div>
  ),
};

/** A practical pricing plan selector built with button-appearance radios. */
export const PlanSelector: Story = {
  render: () => (
    <RadioGroup label="Select Plan" value="pro">
      {[
        { value: 'free', label: 'Free', desc: '$0 / month' },
        { value: 'pro', label: 'Pro', desc: '$12 / month' },
        { value: 'team', label: 'Team', desc: '$49 / month' },
      ].map(({ value, label, desc }) => (
        <Radio key={value} value={value}>
          <span>{label}</span>
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'var(--wa-color-neutral-500)',
            }}
          >
            {desc}
          </span>
        </Radio>
      ))}
    </RadioGroup>
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
      <RadioGroup label="Basic" value="a">
        <Radio value="a">Option A</Radio>
        <Radio value="b">Option B</Radio>
        <Radio value="c" disabled>
          Option C (disabled)
        </Radio>
      </RadioGroup>
      <RadioGroup label="Sizes" value="medium">
        <Radio value="small" size="small">
          Small
        </Radio>
        <Radio value="medium" size="medium">
          Medium
        </Radio>
        <Radio value="large" size="large">
          Large
        </Radio>
      </RadioGroup>
    </div>
  ),
};
