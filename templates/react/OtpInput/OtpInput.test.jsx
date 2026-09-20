import React from 'react';
import { render } from '@testing-library/react';
import { OtpInput } from './OtpInput';

describe('OtpInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<OtpInput />);
    expect(container.querySelector('wa-otp-input')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<OtpInput className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
