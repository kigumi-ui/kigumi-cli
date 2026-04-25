import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DropdownItem } from './DropdownItem';

describe('DropdownItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<DropdownItem />);
    expect(container.querySelector('wa-dropdown-item')).toBeTruthy();
  });
});
