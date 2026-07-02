import type { Meta, StoryObj } from '@storybook/react-vite';
import { Video } from '@/components/ui';
import { fn } from 'storybook/test';

/** Displays a video player with customizable controls, captions, and thumbnails */
const meta = {
  title: 'Components/Video',
  component: Video,
  tags: ['autodocs'],
  argTypes: {
    controls: {
      control: 'select',
      options: ['none', 'standard', 'full'],
      description: 'The set of controls to display',
      table: { defaultValue: { summary: 'standard' } },
    },
    src: { control: 'text', description: 'The video source URL' },
    poster: {
      control: 'text',
      description: 'The poster image URL shown before playback',
    },
    title: { control: 'text', description: 'The video title' },
    thumbnails: {
      control: 'text',
      description: 'URL to a WebVTT file for timeline thumbnail previews',
    },
    playing: {
      control: 'boolean',
      description: 'Whether the video is currently playing',
      table: { defaultValue: { summary: 'false' } },
    },
    muted: {
      control: 'boolean',
      description: 'Whether the video is muted',
      table: { defaultValue: { summary: 'false' } },
    },
    volume: {
      control: 'number',
      description: 'The volume level from 0 to 1',
      table: { defaultValue: { summary: '1' } },
    },
    autoplay: {
      control: 'boolean',
      description: 'Automatically start playback when connected',
      table: { defaultValue: { summary: 'false' } },
    },
    loop: {
      control: 'boolean',
      description: 'Restart playback when the video ends',
      table: { defaultValue: { summary: 'false' } },
    },
    'autoplay-muted': {
      control: 'boolean',
      description: 'Autoplay in a muted state',
      table: { defaultValue: { summary: 'false' } },
    },
    'autoplay-on-visible': {
      control: 'boolean',
      description: 'Resume playback when scrolled back into view',
      table: { defaultValue: { summary: 'false' } },
    },
    preload: {
      control: 'select',
      options: ['auto', 'metadata', 'none'],
      description: 'The browser preload strategy',
      table: { defaultValue: { summary: 'metadata' } },
    },
    'icon-library': {
      control: 'text',
      description: 'The icon library used for built-in control icons',
      table: { defaultValue: { summary: 'system' } },
    },
    onTimeupdate: {
      action: 'timeupdate',
      description: 'Emitted when the time changes.',
      table: { category: 'Events' },
    },
    onPlay: {
      action: 'play',
      description: 'Emitted when playback begins.',
      table: { category: 'Events' },
    },
    onPause: {
      action: 'pause',
      description: 'Emitted when playback stops.',
      table: { category: 'Events' },
    },
    onVolumechange: {
      action: 'volumechange',
      description: 'Emitted when the volume changes.',
      table: { category: 'Events' },
    },
    onError: {
      action: 'error',
      description: 'Emitted when an error occurs while loading/playing.',
      table: { category: 'Events' },
    },
    onEnded: {
      action: 'ended',
      description: 'Emitted when playback ends.',
      table: { category: 'Events' },
    },
    onLoadedmetadata: {
      action: 'loadedmetadata',
      description: 'Emitted when metadata has been loaded.',
      table: { category: 'Events' },
    },
  },
  args: {
    onTimeupdate: fn(),
    onPlay: fn(),
    onPause: fn(),
    onVolumechange: fn(),
    onError: fn(),
    onEnded: fn(),
    onLoadedmetadata: fn(),
  },
} satisfies Meta<typeof Video>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_SRC = 'https://videos.webawesome.com/video/sample.mp4';
const SAMPLE_POSTER = 'https://images.webawesome.com/video/poster.jpg';

/** A standard player with the default control set. */
export const Default: Story = {
  args: {
    src: SAMPLE_SRC,
    poster: SAMPLE_POSTER,
    title: 'Sample Video',
    controls: 'standard',
  },
};

/** The full control set adds playback speed and picture-in-picture. */
export const FullControls: Story = {
  args: {
    src: SAMPLE_SRC,
    poster: SAMPLE_POSTER,
    title: 'Sample Video',
    controls: 'full',
  },
};

/** No chrome — useful for background or hero videos. */
export const NoControls: Story = {
  args: {
    src: SAMPLE_SRC,
    poster: SAMPLE_POSTER,
    controls: 'none',
    muted: true,
    loop: true,
  },
};
