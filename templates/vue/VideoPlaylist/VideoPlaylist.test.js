import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import VideoPlaylist from './VideoPlaylist.vue';

describe('VideoPlaylist', () => {
  it('renders without crashing', () => {
    const { container } = render(VideoPlaylist);
    expect(container.querySelector('wa-video-playlist')).toBeTruthy();
  });
});
