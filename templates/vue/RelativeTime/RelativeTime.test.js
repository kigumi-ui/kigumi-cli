import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import RelativeTime from './RelativeTime.vue';

describe('RelativeTime', () => {
  it('renders without crashing', () => {
    const { container } = render(RelativeTime);
    expect(container.querySelector('wa-relative-time')).toBeTruthy();
  });
});
