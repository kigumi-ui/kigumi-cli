import type { Meta, StoryObj } from '@storybook/react-vite';
import { Scroller } from '@/components/ui';

const meta = {
  title: 'Layout/Scroller',
  component: Scroller,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'vertical' } },
    },
    'without-scrollbar': { control: 'boolean' },
    'without-shadow': { control: 'boolean' },
  },
} satisfies Meta<typeof Scroller>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Scroller
      {...args}
      style={{
        height: '200px',
        border: '1px solid var(--wa-color-neutral-200)',
        borderRadius: '0.5rem',
      }}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--wa-color-neutral-100)',
          }}
        >
          Item {i + 1}
        </div>
      ))}
    </Scroller>
  ),
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <Scroller
      {...args}
      style={{
        border: '1px solid var(--wa-color-neutral-200)',
        borderRadius: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem',
          width: 'max-content',
        }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              width: '120px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--wa-color-neutral-100)',
              borderRadius: '0.5rem',
              flexShrink: 0,
            }}
          >
            Card {i + 1}
          </div>
        ))}
      </div>
    </Scroller>
  ),
};

export const WithoutScrollbar: Story = {
  args: { 'without-scrollbar': true },
  render: (args) => (
    <Scroller
      {...args}
      style={{
        height: '200px',
        border: '1px solid var(--wa-color-neutral-200)',
        borderRadius: '0.5rem',
      }}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--wa-color-neutral-100)',
          }}
        >
          Item {i + 1} (scrollbar hidden)
        </div>
      ))}
    </Scroller>
  ),
};

export const WithoutShadow: Story = {
  args: { 'without-shadow': true },
  render: (args) => (
    <Scroller
      {...args}
      style={{
        height: '200px',
        border: '1px solid var(--wa-color-neutral-200)',
        borderRadius: '0.5rem',
      }}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--wa-color-neutral-100)',
          }}
        >
          Item {i + 1} (no fade shadow)
        </div>
      ))}
    </Scroller>
  ),
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
      <Scroller style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: '100px',
                height: '80px',
                background: 'var(--wa-color-brand-fill-subtle)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Item {i + 1}
            </div>
          ))}
        </div>
      </Scroller>
    </div>
  ),
};
