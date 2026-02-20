import type { Meta, StoryObj } from '@storybook/react-vite';
import { ZoomableFrame } from '@/components/ui';

const meta = {
  title: 'Display/ZoomableFrame',
  component: ZoomableFrame,
  tags: ['autodocs'],
  argTypes: {
    zoom: { control: { type: 'range', min: 0.25, max: 4, step: 0.25 } },
    zoomLevels: {
      control: 'text',
      description: 'Comma-separated zoom levels (e.g. "0.5,1,1.5,2")',
    },
    withoutControls: { control: 'boolean' },
    withoutInteraction: { control: 'boolean' },
    loading: { control: 'select', options: ['eager', 'lazy'] },
  },
  args: { zoom: 1 },
} satisfies Meta<typeof ZoomableFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    srcdoc: `
      <html>
        <body style="font-family: sans-serif; padding: 2rem; background: #f9f9f9;">
          <h1>Zoomable Content</h1>
          <p>Use the zoom controls to zoom in and out of this frame.</p>
          <p>This is useful for previewing responsive designs at different scales.</p>
          <button style="padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
            Example Button
          </button>
        </body>
      </html>
    `,
    style: { width: '100%', height: '300px' },
  },
};

export const WithoutControls: Story = {
  args: {
    withoutControls: true,
    zoom: 0.75,
    srcdoc: `
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h1>No UI Controls</h1>
          <p>Zoom is set programmatically via the <code>zoom</code> prop.</p>
        </body>
      </html>
    `,
    style: { width: '100%', height: '300px' },
  },
};

export const CustomZoomLevels: Story = {
  args: {
    zoomLevels: '0.25,0.5,0.75,1,1.5,2',
    srcdoc: `
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h1>Custom Zoom Levels</h1>
          <p>This frame has zoom levels: 0.25, 0.5, 0.75, 1, 1.5, 2</p>
        </body>
      </html>
    `,
    style: { width: '100%', height: '300px' },
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
      <ZoomableFrame
        style={{
          width: '400px',
          height: '300px',
          border: '1px solid var(--wa-color-neutral-border-normal)',
          borderRadius: '0.5rem',
        }}
      >
        <div
          style={{
            padding: '2rem',
            background: 'var(--wa-color-brand-fill-subtle)',
          }}
        >
          <h3 style={{ margin: '0 0 1rem' }}>Zoomable Content</h3>
          <p>Use Ctrl+scroll to zoom in/out on this frame.</p>
        </div>
      </ZoomableFrame>
    </div>
  ),
};
