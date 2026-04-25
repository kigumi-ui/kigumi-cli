import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { RadioGroup } from './RadioGroup';

describe('RadioGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(<RadioGroup label="Options" />);
    expect(container.querySelector('wa-radio-group')).toBeInTheDocument();
  });

  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(<RadioGroup ref={ref} label="Options" />);
    expect(ref.current).toHaveProperty('focus');
  });
});
