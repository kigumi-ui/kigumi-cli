import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Carousel from './Carousel.vue';

describe('Carousel', () => {
  it('renders without crashing', () => {
    const { container } = render(Carousel);
    expect(container.querySelector('wa-carousel')).toBeTruthy();
  });
});
