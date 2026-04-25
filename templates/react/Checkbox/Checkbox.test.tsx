import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders without crashing', () => {
    const { container } = render(<Checkbox />);
    expect(container.querySelector('wa-checkbox')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-checkbox', () => {
    const { container } = render(<Checkbox className="custom-class" />);
    const element = container.querySelector('wa-checkbox');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
