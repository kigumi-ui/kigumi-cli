import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import DropdownItem from './DropdownItem.vue';

describe('DropdownItem', () => {
  it('renders without crashing', () => {
    const { container } = render(DropdownItem);
    expect(container.querySelector('wa-dropdown-item')).toBeTruthy();
  });
});
