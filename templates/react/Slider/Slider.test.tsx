import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Slider } from './Slider';

describe('Slider', () => {
  it('renders without crashing', () => {
    const { container } = render(<Slider />);
    expect(container.querySelector('wa-slider')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-slider', () => {
    const { container } = render(<Slider className="custom-class" />);
    const element = container.querySelector('wa-slider');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});
