import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Slider from './Slider.vue';

describe('Slider', () => {
  it('renders without crashing', () => {
    const { container } = render(Slider);
    expect(container.querySelector('wa-slider')).toBeTruthy();
  });
});
