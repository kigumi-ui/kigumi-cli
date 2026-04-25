import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import TabGroup from './TabGroup.vue';

describe('TabGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(TabGroup);
    expect(container.querySelector('wa-tab-group')).toBeTruthy();
  });
});
