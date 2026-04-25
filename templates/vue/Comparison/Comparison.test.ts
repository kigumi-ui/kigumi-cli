import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Comparison from './Comparison.vue';

describe('Comparison', () => {
  it('renders without crashing', () => {
    const { container } = render(Comparison);
    expect(container.querySelector('wa-comparison')).toBeTruthy();
  });
});
