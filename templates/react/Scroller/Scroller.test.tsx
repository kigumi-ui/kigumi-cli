import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Scroller } from './Scroller';

describe('Scroller', () => {
  it('renders without crashing', () => {
    const { container } = render(<Scroller />);
    expect(container.querySelector('wa-scroller')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-scroller', () => {
    const { container } = render(<Scroller className="custom-class" />);
    const element = container.querySelector('wa-scroller');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
