import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FormatNumber } from './FormatNumber';

describe('FormatNumber', () => {
  it('renders without crashing', () => {
    const { container } = render(<FormatNumber />);
    expect(container.querySelector('wa-format-number')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-format-number', () => {
    const { container } = render(<FormatNumber className="custom-class" />);
    const element = container.querySelector('wa-format-number');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
