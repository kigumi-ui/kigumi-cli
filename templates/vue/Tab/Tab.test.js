import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Tab from './Tab.vue';

describe('Tab', () => {
  it('renders without crashing', () => {
    const { container } = render(Tab);
    expect(container.querySelector('wa-tab')).toBeTruthy();
  });
});
