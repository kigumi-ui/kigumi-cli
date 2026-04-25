import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Include from './Include.vue';

describe('Include', () => {
  it('renders without crashing', () => {
    const { container } = mount(Include);
    expect(container.querySelector('wa-include')).toBeTruthy();
  });
});
