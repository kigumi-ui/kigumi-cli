import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/vue';
import Avatar from './Avatar.vue';

describe('Avatar', () => {
  it('renders without crashing', () => {
    const { container } = render(Avatar);
    expect(container.querySelector('wa-avatar')).toBeTruthy();
  });
});
