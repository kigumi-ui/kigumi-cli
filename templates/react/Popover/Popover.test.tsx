import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Popover } from './Popover';

describe('Popover', () => {
  it('renders without crashing', () => {
    const { container } = render(<Popover />);
    expect(container.querySelector('wa-popover')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-popover', () => {
    const { container } = render(<Popover className="custom-class" />);
    const element = container.querySelector('wa-popover');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
