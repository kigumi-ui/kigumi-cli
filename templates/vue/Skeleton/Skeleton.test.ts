import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Skeleton from './Skeleton.vue';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(Skeleton);
    expect(container.querySelector('wa-skeleton')).toBeTruthy();
  });
});
