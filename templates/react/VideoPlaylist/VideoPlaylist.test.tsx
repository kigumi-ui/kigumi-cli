import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VideoPlaylist } from './VideoPlaylist';

describe('VideoPlaylist', () => {
  it('renders without crashing', () => {
    const { container } = render(<VideoPlaylist />);
    expect(container.querySelector('wa-video-playlist')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-video-playlist', () => {
    const { container } = render(<VideoPlaylist className="custom-class" />);
    const element = container.querySelector('wa-video-playlist');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
