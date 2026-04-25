import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ZoomableFrame } from './ZoomableFrame';

describe('ZoomableFrame', () => {
  it('renders without crashing', () => {
    const { container } = render(<ZoomableFrame />);
    expect(container.querySelector('wa-zoomable-frame')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-zoomable-frame', () => {
    const { container } = render(<ZoomableFrame className="custom-class" />);
    const element = container.querySelector('wa-zoomable-frame');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
