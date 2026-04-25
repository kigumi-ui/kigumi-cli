import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import DoughnutChart from './DoughnutChart.vue';

describe('DoughnutChart', () => {
  it('renders without crashing', () => {
    const { container } = render(DoughnutChart);
    expect(container.querySelector('wa-doughnut-chart')).toBeTruthy();
  });
});
