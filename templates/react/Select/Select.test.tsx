import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Select } from './Select';

describe('Select', () => {
  it('renders without crashing', () => {
    const { container } = render(<Select />);
    expect(container.querySelector('wa-select')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-select', () => {
    const { container } = render(<Select className="custom-class" />);
    const element = container.querySelector('wa-select');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
