import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import DropdownItem from './DropdownItem.vue';

describe('DropdownItem', () => {
  it('renders without crashing', () => {
    const { container } = mount(DropdownItem);
    expect(container.querySelector('wa-dropdown-item')).toBeTruthy();
  });
});
