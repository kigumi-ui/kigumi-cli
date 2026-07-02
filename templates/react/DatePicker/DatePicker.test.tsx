import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DatePicker } from './DatePicker';

describe('DatePicker', () => {
  it('renders without crashing', () => {
    const { container } = render(<DatePicker />);
    expect(container.querySelector('wa-date-picker')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-date-picker', () => {
    const { container } = render(<DatePicker className="custom-class" />);
    const element = container.querySelector('wa-date-picker');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
