import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Dropdown from './Dropdown.vue';

describe('Dropdown', () => {
  it('renders without crashing', () => {
    const { container } = mount(Dropdown);
    expect(container.querySelector('wa-dropdown')).toBeTruthy();
  });
});
