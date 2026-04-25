import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Include from './Include.vue';

describe('Include', () => {
  it('renders without crashing', () => {
    const { container } = render(Include);
    expect(container.querySelector('wa-include')).toBeTruthy();
  });
});
