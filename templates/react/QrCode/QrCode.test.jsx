import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { QrCode } from './QrCode';

describe('QrCode', () => {
  it('renders without crashing', () => {
    const { container } = render(<QrCode value="https://example.com" />);
    expect(container.querySelector('wa-qr-code')).toBeInTheDocument();
  });
});
