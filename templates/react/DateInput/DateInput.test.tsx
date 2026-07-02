import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DateInput } from './DateInput';

describe('DateInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<DateInput />);
    expect(container.querySelector('wa-date-input')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-date-input', () => {
    const { container } = render(<DateInput className="custom-class" />);
    const element = container.querySelector('wa-date-input');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
