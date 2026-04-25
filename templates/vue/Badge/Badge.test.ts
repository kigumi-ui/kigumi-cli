import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import Badge from './Badge.vue';

describe('Badge', () => {
  it('renders without crashing', () => {
    const { container } = mount(Badge);
    expect(container.querySelector('wa-badge')).toBeTruthy();
  });
});
