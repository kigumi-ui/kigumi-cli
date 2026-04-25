import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import PieChart from './PieChart.vue';

describe('PieChart', () => {
  it('renders without crashing', () => {
    const { container } = render(PieChart);
    expect(container.querySelector('wa-pie-chart')).toBeTruthy();
  });
});
