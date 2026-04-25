import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Skeleton from './Skeleton.vue';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = mount(Skeleton);
    expect(container.querySelector('wa-skeleton')).toBeTruthy();
  });
});
