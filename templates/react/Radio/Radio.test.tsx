import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Radio } from './Radio';

describe('Radio', () => {
  it('renders without crashing', () => {
    const { container } = render(<Radio />);
    expect(container.querySelector('wa-radio')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-radio', () => {
    const { container } = render(<Radio className="custom-class" />);
    const element = container.querySelector('wa-radio');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
