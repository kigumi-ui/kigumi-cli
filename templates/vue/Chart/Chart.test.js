import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Chart from './Chart.vue';

describe('Chart', () => {
  it('renders without crashing', () => {
    const { container } = render(Chart);
    expect(container.querySelector('wa-chart')).toBeTruthy();
  });
});
