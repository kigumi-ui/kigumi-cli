import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Chart } from './Chart';

describe('Chart', () => {
  it('renders without crashing', () => {
    const { container } = render(<Chart />);
    expect(container.querySelector('wa-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-chart', () => {
    const { container } = render(<Chart className="custom-class" />);
    const element = container.querySelector('wa-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
