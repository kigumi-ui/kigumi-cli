import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Sparkline from './Sparkline.vue';

describe('Sparkline', () => {
  it('renders without crashing', () => {
    const { container } = mount(Sparkline);
    expect(container.querySelector('wa-sparkline')).toBeTruthy();
  });
});
