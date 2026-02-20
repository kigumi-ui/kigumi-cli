import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Popup, Button } from '@/components/ui';

const meta = {
  title: 'Overlay/Popup',
  component: Popup,
  tags: ['autodocs'],
  argTypes: {
    active: { control: 'boolean' },
    placement: {
      control: 'select',
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'right',
        'right-start',
        'right-end',
        'left',
        'left-start',
        'left-end',
      ],
      table: { defaultValue: { summary: 'top' } },
    },
    distance: { control: 'number' },
    skidding: { control: 'number' },
    arrow: { control: 'boolean' },
    flip: { control: 'boolean' },
    shift: { control: 'boolean' },
    onReposition: { action: 'reposition' },
    anchor: { table: { disable: true } },
  },
  args: {
    active: true,
    placement: 'top',
    onReposition: fn(),
  },
} satisfies Meta<typeof Popup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ padding: '6rem', display: 'flex', justifyContent: 'center' }}>
      <Popup {...args} anchor="popup-anchor">
        <div
          style={{
            background: 'var(--wa-color-neutral-900)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
          }}
        >
          Popup content
        </div>
      </Popup>
      <Button id="popup-anchor">Anchor Element</Button>
    </div>
  ),
};

export const WithArrow: Story = {
  args: { arrow: true, placement: 'bottom' },
  render: (args) => (
    <div style={{ padding: '5rem', display: 'flex', justifyContent: 'center' }}>
      <Popup {...args} anchor="popup-arrow-anchor">
        <div
          style={{
            background: 'var(--wa-color-brand-600)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
          }}
        >
          Popup with arrow
        </div>
      </Popup>
      <Button id="popup-arrow-anchor" variant="brand">
        Anchor
      </Button>
    </div>
  ),
};

export const Placements: Story = {
  render: () => {
    const placements = ['top', 'bottom', 'left', 'right'] as const;
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4rem',
          padding: '4rem',
          justifyContent: 'center',
        }}
      >
        {placements.map((p) => (
          <div key={p} style={{ position: 'relative' }}>
            <Popup
              active
              anchor={`popup-${p}`}
              placement={p}
              distance={8}
              arrow
            >
              <div
                style={{
                  background: 'var(--wa-color-neutral-800)',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {p}
              </div>
            </Popup>
            <Button id={`popup-${p}`} size="small">
              {p}
            </Button>
          </div>
        ))}
      </div>
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
        gap: '6rem',
        padding: '3rem',
      }}
    >
      <Popup active placement="bottom">
        <Button slot="anchor">Anchor</Button>
        <div
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--wa-color-neutral-fill-loud)',
            color: 'white',
            borderRadius: '4px',
          }}
        >
          Popup Content
        </div>
      </Popup>
    </div>
  ),
};
