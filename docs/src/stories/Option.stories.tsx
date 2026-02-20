import type { Meta, StoryObj } from '@storybook/react-vite';
import { Option, Select, Icon } from '@/components/ui';

const meta = {
  title: 'Inputs/Option',
  component: Option,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The value submitted when selected',
    },
    disabled: { control: 'boolean' },
  },
  args: { value: 'option' },
} satisfies Meta<typeof Option>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Select label="Select an option">
      <Option {...args}>Option Label</Option>
      <Option value="a">Option A</Option>
      <Option value="b">Option B</Option>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select label="Status">
      <Option value="active">Active</Option>
      <Option value="pending">Pending</Option>
      <Option value="archived" disabled>
        Archived (unavailable)
      </Option>
      <Option value="deleted" disabled>
        Deleted (unavailable)
      </Option>
    </Select>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Select label="Priority">
      <Option value="low">
        <Icon
          name="arrow-down"
          slot="prefix"
          style={{ color: 'var(--wa-color-neutral-500)' }}
        />
        Low
      </Option>
      <Option value="medium">
        <Icon
          name="dash"
          slot="prefix"
          style={{ color: 'var(--wa-color-warning-600)' }}
        />
        Medium
      </Option>
      <Option value="high">
        <Icon
          name="arrow-up"
          slot="prefix"
          style={{ color: 'var(--wa-color-danger-600)' }}
        />
        High
      </Option>
      <Option value="critical">
        <Icon
          name="exclamation-triangle"
          slot="prefix"
          style={{ color: 'var(--wa-color-danger-700)' }}
        />
        Critical
      </Option>
    </Select>
  ),
};

export const WithSuffix: Story = {
  render: () => (
    <Select label="Team Member">
      {[
        { value: 'alice', name: 'Alice Johnson', role: 'Designer' },
        { value: 'bob', name: 'Bob Smith', role: 'Engineer' },
        { value: 'carol', name: 'Carol White', role: 'PM' },
      ].map(({ value, name, role }) => (
        <Option key={value} value={value}>
          {name}
          <span
            slot="suffix"
            style={{
              fontSize: '0.75rem',
              color: 'var(--wa-color-neutral-500)',
            }}
          >
            {role}
          </span>
        </Option>
      ))}
    </Select>
  ),
};

export const ManyOptions: Story = {
  render: () => {
    const countries = [
      'United States',
      'Canada',
      'United Kingdom',
      'Germany',
      'France',
      'Japan',
      'Australia',
      'Brazil',
      'India',
      'China',
      'Mexico',
      'Spain',
      'Italy',
      'Netherlands',
      'Sweden',
    ];
    return (
      <Select label="Country" placeholder="Select a country">
        {countries.map((c) => (
          <Option key={c} value={c.toLowerCase().replace(/\s/g, '-')}>
            {c}
          </Option>
        ))}
      </Select>
    );
  },
};

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
      <Select label="Fruits" value="apple">
        <Option value="apple">Apple</Option>
        <Option value="banana">Banana</Option>
        <Option value="cherry" disabled>
          Cherry (disabled)
        </Option>
        <Option value="date">
          <Icon name="star" slot="prefix" />
          Date
        </Option>
      </Select>
    </div>
  ),
};
