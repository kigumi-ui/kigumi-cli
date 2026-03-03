import type { Meta, StoryObj } from '@storybook/react-vite';
import { ZoomableFrame } from '@/components/ui';

/** Zoomable frames display iframe content with zoom controls */
const meta = {
  title: 'Components/Zoomable Frame',
  component: ZoomableFrame,
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text', description: 'URL of content to display' },
    srcdoc: { control: 'text', description: 'Inline HTML to render' },
    zoom: {
      control: 'number',
      description: 'Current zoom level',
      table: { defaultValue: { summary: '1' } },
    },
    'zoom-levels': {
      control: 'text',
      description: 'Available zoom levels',
      table: {
        defaultValue: { summary: '25% 50% 75% 100% 125% 150% 175% 200%' },
      },
    },
    allowfullscreen: {
      control: 'boolean',
      description: 'Enables fullscreen',
      table: { defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'select',
      options: ['eager', 'lazy'],
      description: 'Loading behavior',
      table: { defaultValue: { summary: 'eager' } },
    },
    'without-controls': {
      control: 'boolean',
      description: 'Hides zoom controls',
      table: { defaultValue: { summary: 'false' } },
    },
    'without-interaction': {
      control: 'boolean',
      description: 'Disables interaction',
      table: { defaultValue: { summary: 'false' } },
    },
    sandbox: { control: 'text', description: 'Security restrictions' },
    referrerpolicy: { control: 'text', description: 'Referrer policy' },
    onLoad: {
      action: 'load',
      description: 'Emitted when the internal iframe when it finishes loading.',
      table: { category: 'Events' },
    },
    onError: {
      action: 'error',
      description: 'Emitted from the internal iframe when it fails to load.',
      table: { category: 'Events' },
    },
    'slot:zoom-in-icon': {
      control: false,
      description: 'The slot that contains the zoom in icon.',
      table: { category: 'Slots' },
    },
    'slot:zoom-out-icon': {
      control: false,
      description: 'The slot that contains the zoom out icon.',
      table: { category: 'Slots' },
    },
    'method:zoomIn': {
      control: false,
      description: 'Zooms in to the next available zoom level.',
      table: { category: 'Methods' },
    },
    'method:zoomOut': {
      control: false,
      description: 'Zooms out to the previous available zoom level.',
      table: { category: 'Methods' },
    },
  },
  args: {
    onLoad: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof ZoomableFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An iframe with the default zoom controls and an HTML page. */
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

/** Hides the UI controls; zoom is set programmatically via the zoom prop. */
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

/** Restricts zoom to a custom set of discrete scale values. */
export const CustomZoomLevels: Story = {
  args: {
    'zoom-levels': '0.25,0.5,0.75,1,1.5,2',
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
