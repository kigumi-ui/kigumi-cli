import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import PolarAreaChart from './PolarAreaChart.vue';

describe('PolarAreaChart', () => {
  it('renders without crashing', () => {
    const { container } = render(PolarAreaChart);
    expect(container.querySelector('wa-polar-area-chart')).toBeTruthy();
  });
});
