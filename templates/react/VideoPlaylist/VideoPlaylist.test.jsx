import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { VideoPlaylist } from './VideoPlaylist';
import React from 'react';

describe('VideoPlaylist', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <VideoPlaylist>
        <div>Video</div>
      </VideoPlaylist>
    );
    expect(container.querySelector('wa-video-playlist')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(
      <VideoPlaylist ref={ref}>
        <div>Video</div>
      </VideoPlaylist>
    );
    expect(ref.current).toHaveProperty('next');
    expect(ref.current).toHaveProperty('previous');
    expect(ref.current).toHaveProperty('goTo');
  });

  it('passes video-playlist props', () => {
    const { container } = render(
      <VideoPlaylist controls="standard">
        <div>Video</div>
      </VideoPlaylist>
    );
    const element = container.querySelector('wa-video-playlist');
    expect(element?.getAttribute('controls')).toBe('standard');
  });
});
