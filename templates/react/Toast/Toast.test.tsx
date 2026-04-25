import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders without crashing', () => {
    const { container } = render(<Toast />);
    expect(container.querySelector('wa-toast')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-toast', () => {
    const { container } = render(<Toast className="custom-class" />);
    const element = container.querySelector('wa-toast');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
