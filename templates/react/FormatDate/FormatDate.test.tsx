import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FormatDate } from './FormatDate';

describe('FormatDate', () => {
  it('renders without crashing', () => {
    const { container } = render(<FormatDate />);
    expect(container.querySelector('wa-format-date')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-format-date', () => {
    const { container } = render(<FormatDate className="custom-class" />);
    const element = container.querySelector('wa-format-date');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
