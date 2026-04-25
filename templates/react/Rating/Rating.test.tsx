import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Rating } from './Rating';

describe('Rating', () => {
  it('renders without crashing', () => {
    const { container } = render(<Rating />);
    expect(container.querySelector('wa-rating')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-rating', () => {
    const { container } = render(<Rating className="custom-class" />);
    const element = container.querySelector('wa-rating');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
