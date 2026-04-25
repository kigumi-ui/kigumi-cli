import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Badge from './Badge.vue';

describe('Badge', () => {
  it('renders without crashing', () => {
    const { container } = render(Badge);
    expect(container.querySelector('wa-badge')).toBeTruthy();
  });
});
