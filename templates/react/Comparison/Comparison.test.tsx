import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Comparison } from './Comparison';

describe('Comparison', () => {
  it('renders without crashing', () => {
    const { container } = render(<Comparison />);
    expect(container.querySelector('wa-comparison')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-comparison', () => {
    const { container } = render(<Comparison className="custom-class" />);
    const element = container.querySelector('wa-comparison');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
