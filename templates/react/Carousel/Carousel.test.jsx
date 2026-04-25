import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Carousel } from './Carousel';

describe('Carousel', () => {
  it('renders without crashing', () => {
    const { container } = render(<Carousel />);
    expect(container.querySelector('wa-carousel')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(<Carousel ref={ref} />);
    expect(ref.current).toHaveProperty('goToSlide');
    expect(ref.current).toHaveProperty('next');
    expect(ref.current).toHaveProperty('previous');
  });

  it('applies custom className', () => {
    const { container } = render(<Carousel className="custom-class" />);
    const element = container.querySelector('wa-carousel');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
