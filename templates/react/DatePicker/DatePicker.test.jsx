import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DatePicker } from './DatePicker';
import React from 'react';

describe('DatePicker', () => {
  it('renders without crashing', () => {
    const { container } = render(<DatePicker />);
    expect(container.querySelector('wa-date-picker')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(<DatePicker ref={ref} />);
    expect(ref.current).toHaveProperty('goToToday');
    expect(ref.current).toHaveProperty('clear');
  });

  it('passes date-picker props', () => {
    const { container } = render(<DatePicker mode="range" size="l" />);
    const element = container.querySelector('wa-date-picker');
    expect(element?.getAttribute('mode')).toBe('range');
    expect(element?.getAttribute('size')).toBe('l');
  });
});
