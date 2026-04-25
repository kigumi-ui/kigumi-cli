import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import MutationObserver from './MutationObserver.vue';

describe('MutationObserver', () => {
  it('renders without crashing', () => {
    const { container } = render(MutationObserver);
    expect(container.querySelector('wa-mutation-observer')).toBeTruthy();
  });
});
