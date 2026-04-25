import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import LineChart from './LineChart.vue';

describe('LineChart', () => {
  it('renders without crashing', () => {
    const { container } = render(LineChart);
    expect(container.querySelector('wa-line-chart')).toBeTruthy();
  });
});
