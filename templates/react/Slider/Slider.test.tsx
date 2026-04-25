import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Slider } from './Slider';

describe('Slider', () => {
  it('renders without crashing', () => {
    const { container } = render(<Slider />);
    expect(container.querySelector('wa-slider')).toBeTruthy();
  });
});
