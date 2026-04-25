import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import QrCode from './QrCode.vue';

describe('QrCode', () => {
  it('renders without crashing', () => {
    const { container } = render(QrCode);
    expect(container.querySelector('wa-qr-code')).toBeTruthy();
  });
});
