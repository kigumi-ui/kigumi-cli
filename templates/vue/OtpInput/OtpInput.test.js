import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import OtpInput from './OtpInput.vue';

describe('OtpInput', () => {
  it('renders without crashing', () => {
    const { container } = render(OtpInput);
    expect(container.querySelector('wa-otp-input')).toBeTruthy();
  });
});
