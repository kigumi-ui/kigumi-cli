import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import IntersectionObserver from './IntersectionObserver.vue';

describe('IntersectionObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(IntersectionObserver);
    expect(container.querySelector('wa-intersection-observer')).toBeTruthy();
  });
});
