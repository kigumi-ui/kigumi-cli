import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Tooltip from './Tooltip.vue';

describe('Tooltip', () => {
  it('renders without crashing', () => {
    const { container } = mount(Tooltip);
    expect(container.querySelector('wa-tooltip')).toBeTruthy();
  });
});
