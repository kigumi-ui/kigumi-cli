import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedImage } from './AnimatedImage';

describe('AnimatedImage', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <AnimatedImage src="test.gif" alt="Test animation" />
    );
    expect(container.querySelector('wa-animated-image')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedImage src="test.gif" alt="Test" className="custom-class" />
    );
    const element = container.querySelector('wa-animated-image');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });

  it('passes src and alt props', () => {
    const { container } = render(
      <AnimatedImage src="animation.gif" alt="My animation" />
    );
    const element = container.querySelector('wa-animated-image');
    expect(element?.getAttribute('src')).toBe('animation.gif');
    expect(element?.getAttribute('alt')).toBe('My animation');
  });
});
