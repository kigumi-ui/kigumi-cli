import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import CarouselItem from './CarouselItem.vue';

describe('CarouselItem', () => {
  it('renders without crashing', () => {
    const { container } = render(CarouselItem);
    expect(container.querySelector('wa-carousel-item')).toBeTruthy();
  });
});
