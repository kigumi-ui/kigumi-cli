import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import ResizeObserver from './ResizeObserver.vue';

describe('ResizeObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(ResizeObserver);
    expect(container.querySelector('wa-resize-observer')).toBeTruthy();
  });
});
