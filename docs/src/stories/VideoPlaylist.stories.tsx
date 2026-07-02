import type { Meta, StoryObj } from '@storybook/react-vite';
import { Video, VideoPlaylist } from '@/components/ui';
import { fn } from 'storybook/test';

/** Groups multiple videos into a playlist with next/previous navigation */
const meta = {
  title: 'Components/VideoPlaylist',
  component: VideoPlaylist,
  tags: ['autodocs'],
  argTypes: {
    controls: {
      control: 'select',
      options: ['none', 'standard', 'full'],
      description: 'The set of controls forwarded to each child video',
      table: { defaultValue: { summary: 'full' } },
    },
    'icon-library': {
      control: 'text',
      description: 'The icon library used for placeholder icons',
      table: { defaultValue: { summary: 'system' } },
    },
    onVideoChange: {
      action: 'video-change',
      description: 'Emitted when the active video changes.',
      table: { category: 'Events' },
    },
  },
  args: {
    onVideoChange: fn(),
  },
} satisfies Meta<typeof VideoPlaylist>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_POSTER = 'https://images.webawesome.com/video/poster.jpg';
const clips = [
  { src: 'https://videos.webawesome.com/video/one.mp4', title: 'Chapter 1' },
  { src: 'https://videos.webawesome.com/video/two.mp4', title: 'Chapter 2' },
  { src: 'https://videos.webawesome.com/video/three.mp4', title: 'Chapter 3' },
];

/** A playlist of three chapters with next/previous navigation. */
export const Default: Story = {
  render: (args) => (
    <VideoPlaylist {...args}>
      {clips.map((clip) => (
        <Video
          key={clip.src}
          src={clip.src}
          title={clip.title}
          poster={SAMPLE_POSTER}
        />
      ))}
    </VideoPlaylist>
  ),
};
