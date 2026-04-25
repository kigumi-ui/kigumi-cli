import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IntersectionObserver } from './IntersectionObserver';

describe('IntersectionObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(<IntersectionObserver />);
    expect(container.querySelector('wa-intersection-observer')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-intersection-observer', () => {
    const { container } = render(<IntersectionObserver className="custom-class" />);
    const element = container.querySelector('wa-intersection-observer');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
