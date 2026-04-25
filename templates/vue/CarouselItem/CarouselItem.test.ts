import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import CarouselItem from './CarouselItem.vue';

describe('CarouselItem', () => {
  it('renders without crashing', () => {
    const { container } = mount(CarouselItem);
    expect(container.querySelector('wa-carousel-item')).toBeTruthy();
  });
});
