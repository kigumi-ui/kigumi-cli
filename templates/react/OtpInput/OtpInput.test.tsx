import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { OtpInput } from './OtpInput';

describe('OtpInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<OtpInput />);
    expect(container.querySelector('wa-otp-input')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-otp-input', () => {
    const { container } = render(<OtpInput className="custom-class" />);
    const element = container.querySelector('wa-otp-input');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
