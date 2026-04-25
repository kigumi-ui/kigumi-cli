import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Scroller from './Scroller.vue';

describe('Scroller', () => {
  it('renders without crashing', () => {
    const { container } = render(Scroller);
    expect(container.querySelector('wa-scroller')).toBeTruthy();
  });
});
