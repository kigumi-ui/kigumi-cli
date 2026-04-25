import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import TabPanel from './TabPanel.vue';

describe('TabPanel', () => {
  it('renders without crashing', () => {
    const { container } = mount(TabPanel);
    expect(container.querySelector('wa-tab-panel')).toBeTruthy();
  });
});
