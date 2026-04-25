import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import SplitPanel from './SplitPanel.vue';

describe('SplitPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(SplitPanel);
    expect(container.querySelector('wa-split-panel')).toBeTruthy();
  });
});
