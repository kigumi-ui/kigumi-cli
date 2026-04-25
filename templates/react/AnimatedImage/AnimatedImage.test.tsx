import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedImage } from './AnimatedImage';

describe('AnimatedImage', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnimatedImage src="test.gif" alt="Test image" />);
    expect(container.querySelector('wa-animated-image')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-animated-image', () => {
    const { container } = render(<AnimatedImage src="test.gif" alt="Test image" className="custom-class" />);
    const element = container.querySelector('wa-animated-image');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });

  it('forwards required attributes to the underlying wa-animated-image', () => {
    const { container } = render(<AnimatedImage src="test.gif" alt="Test image" />);
    const element = container.querySelector('wa-animated-image');
    expect(element?.getAttribute('src')).toBe('test.gif');
    expect(element?.getAttribute('alt')).toBe('Test image');
  });
});
