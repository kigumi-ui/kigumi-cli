import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DateInput } from './DateInput';
import React from 'react';

describe('DateInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<DateInput label="Date" />);
    expect(container.querySelector('wa-date-input')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(<DateInput ref={ref} label="Date" />);
    expect(ref.current).toHaveProperty('show');
    expect(ref.current).toHaveProperty('hide');
    expect(ref.current).toHaveProperty('clear');
  });

  it('passes date-input props', () => {
    const { container } = render(
      <DateInput label="Date" name="date" required mode="range" />
    );
    const element = container.querySelector('wa-date-input');
    expect(element?.getAttribute('name')).toBe('date');
    expect(element?.getAttribute('mode')).toBe('range');
  });
});
