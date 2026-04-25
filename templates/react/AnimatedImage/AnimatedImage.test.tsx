import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnimatedImage } from './AnimatedImage';

describe('AnimatedImage', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnimatedImage src="src" alt="alt" />);
    expect(container.querySelector('wa-animated-image')).toBeTruthy();
  });
});
