import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LineChart } from './LineChart';

describe('LineChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<LineChart />);
    expect(container.querySelector('wa-line-chart')).toBeTruthy();
  });
});
