import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import BarChart from './BarChart.vue';

describe('BarChart', () => {
  it('renders without crashing', () => {
    const { container } = render(BarChart);
    expect(container.querySelector('wa-bar-chart')).toBeTruthy();
  });
});
