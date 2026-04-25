import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import TabPanel from './TabPanel.vue';

describe('TabPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(TabPanel);
    expect(container.querySelector('wa-tab-panel')).toBeTruthy();
  });
});
