import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@/components/ui';

/**
 * Constrains content to a fixed aspect ratio via `.wa-frame`. Useful for media, maps, and
 * embeds.
 */
const meta = {
  title: 'Layout/Frame',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default square-ish frame containing a full-size skeleton. */
export const Default: Story = {
  render: () => (
    <div className="wa-frame" style={{ width: '400px' }}>
      <Skeleton style={{ width: '100%', height: '100%' }} />
    </div>
  ),
};

/** Portrait (3/4) aspect ratio. */
export const Portrait: Story = {
  render: () => (
    <div
      className="wa-frame"
      style={
        { '--wa-frame-ratio': '3/4', width: '300px' } as React.CSSProperties
      }
    >
      <Skeleton style={{ width: '100%', height: '100%' }} />
    </div>
  ),
};

/** Widescreen (16/9) aspect ratio. */
export const Widescreen: Story = {
  render: () => (
    <div
      className="wa-frame"
      style={
        { '--wa-frame-ratio': '16/9', width: '500px' } as React.CSSProperties
      }
    >
      <Skeleton style={{ width: '100%', height: '100%' }} />
    </div>
  ),
};
