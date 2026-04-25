import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ScatterChart } from './ScatterChart';

describe('ScatterChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScatterChart />);
    expect(container.querySelector('wa-scatter-chart')).toBeTruthy();
  });
});
