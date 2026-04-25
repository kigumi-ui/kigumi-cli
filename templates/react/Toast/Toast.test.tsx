import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders without crashing', () => {
    const { container } = render(<Toast />);
    expect(container.querySelector('wa-toast')).toBeTruthy();
  });
});
