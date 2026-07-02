import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Video } from './Video';
import React from 'react';

describe('Video', () => {
  it('renders without crashing', () => {
    const { container } = render(<Video src="/demo.mp4" />);
    expect(container.querySelector('wa-video')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(<Video ref={ref} src="/demo.mp4" />);
    expect(ref.current).toHaveProperty('play');
    expect(ref.current).toHaveProperty('pause');
  });

  it('passes video props', () => {
    const { container } = render(
      <Video src="/demo.mp4" controls="full" muted />
    );
    const element = container.querySelector('wa-video');
    expect(element?.getAttribute('src')).toBe('/demo.mp4');
    expect(element?.getAttribute('controls')).toBe('full');
  });
});
