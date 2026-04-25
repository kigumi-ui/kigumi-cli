import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Carousel from './Carousel.vue';

describe('Carousel', () => {
  it('renders without crashing', () => {
    const { container } = mount(Carousel);
    expect(container.querySelector('wa-carousel')).toBeTruthy();
  });
});
