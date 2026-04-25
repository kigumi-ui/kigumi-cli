import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline } from './Sparkline';

describe('Sparkline', () => {
  it('renders without crashing', () => {
    const { container } = render(<Sparkline />);
    expect(container.querySelector('wa-sparkline')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-sparkline', () => {
    const { container } = render(<Sparkline className="custom-class" />);
    const element = container.querySelector('wa-sparkline');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
