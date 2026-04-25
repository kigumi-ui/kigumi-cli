import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Carousel } from './Carousel';

describe('Carousel', () => {
  it('renders without crashing', () => {
    const { container } = render(<Carousel />);
    expect(container.querySelector('wa-carousel')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-carousel', () => {
    const { container } = render(<Carousel className="custom-class" />);
    const element = container.querySelector('wa-carousel');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
