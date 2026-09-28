import React from 'react';
import { render } from '@testing-library/react';
import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('renders without crashing', () => {
    const { container } = render(<Stepper />);
    expect(container.querySelector('wa-stepper')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Stepper className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
