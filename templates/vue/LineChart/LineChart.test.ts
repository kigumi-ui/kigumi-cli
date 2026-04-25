import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import LineChart from './LineChart.vue';

describe('LineChart', () => {
  it('renders without crashing', () => {
    const { container } = mount(LineChart);
    expect(container.querySelector('wa-line-chart')).toBeTruthy();
  });
});
