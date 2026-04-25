import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ToastItem } from './ToastItem';

describe('ToastItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<ToastItem />);
    expect(container.querySelector('wa-toast-item')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-toast-item', () => {
    const { container } = render(<ToastItem className="custom-class" />);
    const element = container.querySelector('wa-toast-item');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
