import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CarouselItem } from './CarouselItem';

describe('CarouselItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<CarouselItem />);
    expect(container.querySelector('wa-carousel-item')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-carousel-item', () => {
    const { container } = render(<CarouselItem className="custom-class" />);
    const element = container.querySelector('wa-carousel-item');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
