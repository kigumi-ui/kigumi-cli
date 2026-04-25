import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import RelativeTime from './RelativeTime.vue';

describe('RelativeTime', () => {
  it('renders without crashing', () => {
    const { container } = mount(RelativeTime);
    expect(container.querySelector('wa-relative-time')).toBeTruthy();
  });
});
