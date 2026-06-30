import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TimeInput } from './TimeInput';

describe('TimeInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<TimeInput />);
    expect(container.querySelector('wa-time-input')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-time-input', () => {
    const { container } = render(<TimeInput className="custom-class" />);
    const element = container.querySelector('wa-time-input');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });

  it('passes value prop', () => {
    const { container } = render(<TimeInput value="14:30:00" />);
    const element = container.querySelector('wa-time-input');
    expect(element?.getAttribute('value')).toBe('14:30:00');
  });
});
