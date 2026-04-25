import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DropdownItem } from './DropdownItem';

describe('DropdownItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<DropdownItem />);
    expect(container.querySelector('wa-dropdown-item')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-dropdown-item', () => {
    const { container } = render(<DropdownItem className="custom-class" />);
    const element = container.querySelector('wa-dropdown-item');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
