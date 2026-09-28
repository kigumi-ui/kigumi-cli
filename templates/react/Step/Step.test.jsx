import React from 'react';
import { render } from '@testing-library/react';
import { Step } from './Step';

describe('Step', () => {
  it('renders without crashing', () => {
    const { container } = render(<Step />);
    expect(container.querySelector('wa-step')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Step className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
