import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import BubbleChart from './BubbleChart.vue';

describe('BubbleChart', () => {
  it('renders without crashing', () => {
    const { container } = mount(BubbleChart);
    expect(container.querySelector('wa-bubble-chart')).toBeTruthy();
  });
});
