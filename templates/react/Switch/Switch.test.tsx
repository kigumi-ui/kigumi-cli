import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders without crashing', () => {
    const { container } = render(<Switch />);
    expect(container.querySelector('wa-switch')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-switch', () => {
    const { container } = render(<Switch className="custom-class" />);
    const element = container.querySelector('wa-switch');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
