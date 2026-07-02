import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Video } from './Video';

describe('Video', () => {
  it('renders without crashing', () => {
    const { container } = render(<Video />);
    expect(container.querySelector('wa-video')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-video', () => {
    const { container } = render(<Video className="custom-class" />);
    const element = container.querySelector('wa-video');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
