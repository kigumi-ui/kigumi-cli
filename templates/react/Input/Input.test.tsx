import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders without crashing', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('wa-input')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-input', () => {
    const { container } = render(<Input className="custom-class" />);
    const element = container.querySelector('wa-input');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
