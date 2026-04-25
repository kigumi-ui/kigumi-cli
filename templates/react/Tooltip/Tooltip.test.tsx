import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders without crashing', () => {
    const { container } = render(<Tooltip />);
    expect(container.querySelector('wa-tooltip')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-tooltip', () => {
    const { container } = render(<Tooltip className="custom-class" />);
    const element = container.querySelector('wa-tooltip');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
