import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('renders without crashing', () => {
    const { container } = render(<ColorPicker />);
    expect(container.querySelector('wa-color-picker')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-color-picker', () => {
    const { container } = render(<ColorPicker className="custom-class" />);
    const element = container.querySelector('wa-color-picker');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
