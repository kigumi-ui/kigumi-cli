import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import ScatterChart from './ScatterChart.vue';

describe('ScatterChart', () => {
  it('renders without crashing', () => {
    const { container } = mount(ScatterChart);
    expect(container.querySelector('wa-scatter-chart')).toBeTruthy();
  });
});
