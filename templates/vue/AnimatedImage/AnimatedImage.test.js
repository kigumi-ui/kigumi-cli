import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import AnimatedImage from './AnimatedImage.vue';

describe('AnimatedImage', () => {
  it('renders without crashing', () => {
    const { container } = mount(AnimatedImage);
    expect(container.querySelector('wa-animated-image')).toBeTruthy();
  });
});
