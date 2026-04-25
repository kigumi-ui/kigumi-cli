import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QrCode } from './QrCode';

describe('QrCode', () => {
  it('renders without crashing', () => {
    const { container } = render(<QrCode />);
    expect(container.querySelector('wa-qr-code')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-qr-code', () => {
    const { container } = render(<QrCode className="custom-class" />);
    const element = container.querySelector('wa-qr-code');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
