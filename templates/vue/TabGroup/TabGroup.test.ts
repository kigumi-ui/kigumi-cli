import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import TabGroup from './TabGroup.vue';

describe('TabGroup', () => {
  it('renders without crashing', () => {
    const { container } = mount(TabGroup);
    expect(container.querySelector('wa-tab-group')).toBeTruthy();
  });
});
