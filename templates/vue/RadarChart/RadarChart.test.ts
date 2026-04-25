import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import RadarChart from './RadarChart.vue';

describe('RadarChart', () => {
  it('renders without crashing', () => {
    const { container } = render(RadarChart);
    expect(container.querySelector('wa-radar-chart')).toBeTruthy();
  });
});
