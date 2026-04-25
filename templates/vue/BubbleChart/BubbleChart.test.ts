import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import BubbleChart from './BubbleChart.vue';

describe('BubbleChart', () => {
  it('renders without crashing', () => {
    const { container } = render(BubbleChart);
    expect(container.querySelector('wa-bubble-chart')).toBeTruthy();
  });
});
