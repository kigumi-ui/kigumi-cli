import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Popover from './Popover.vue';

describe('Popover', () => {
  it('renders without crashing', () => {
    const { container } = mount(Popover);
    expect(container.querySelector('wa-popover')).toBeTruthy();
  });
});
