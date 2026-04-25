import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Rating from './Rating.vue';

describe('Rating', () => {
  it('renders without crashing', () => {
    const { container } = render(Rating);
    expect(container.querySelector('wa-rating')).toBeTruthy();
  });
});
