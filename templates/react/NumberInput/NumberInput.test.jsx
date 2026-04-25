import React from 'react';
import { render } from '@testing-library/react';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<NumberInput />);
    expect(container.querySelector('wa-number-input')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<NumberInput className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
